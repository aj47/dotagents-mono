import { describe, expect, it, vi } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import {
  type AppConfig,
  DEFAULT_APP_CONFIG,
  DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  DEFAULT_HANDS_FREE_SEND_PHRASE,
  DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  DEFAULT_HANDS_FREE_WAKE_PHRASE,
  MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  loadConfig,
  normalizeStoredConfig,
} from './config';

describe('loadConfig', () => {
  it('repairs a missing app config from successful tunnel metadata', async () => {
    vi.mocked(AsyncStorage.getItem).mockImplementation(async (key) => {
      if (key === 'app_config_v1') return null;
      if (key === 'dotagents_tunnel_metadata_v1') {
        return JSON.stringify({
          baseUrl: 'http://desktop.example:3210/v1',
          apiKey: 'paired-secret',
          lastConnectedAt: Date.now(),
        });
      }
      return null;
    });

    const loaded = await loadConfig();

    expect(loaded.baseUrl).toBe('http://desktop.example:3210/v1');
    expect(loaded.apiKey).toBe('paired-secret');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'app_config_v1',
      expect.stringContaining('http://desktop.example:3210/v1'),
    );
  });
});

describe('normalizeStoredConfig', () => {
  it('backfills the handsfree defaults for older configs', () => {
    const normalized = normalizeStoredConfig({
      apiKey: 'test',
      baseUrl: 'https://api.openai.com/v1/',
      model: 'gpt-4.1-mini',
    });

    expect(normalized.handsFree).toBe(false);
    expect(normalized.handsFreeAutoSend).toBe(true);
    expect(normalized.handsFreeSendPhrase).toBe(DEFAULT_HANDS_FREE_SEND_PHRASE);
    expect(normalized.handsFreeMessageDebounceMs).toBe(DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS);
    expect(normalized.handsFreeWakePhrase).toBe(DEFAULT_HANDS_FREE_WAKE_PHRASE);
    expect(normalized.handsFreeSleepPhrase).toBe(DEFAULT_HANDS_FREE_SLEEP_PHRASE);
    expect(normalized.handsFreeDebug).toBe(false);
    expect(normalized.mentraEnabled).toBe(false);
    expect(normalized.mobileSttProvider).toBe('native');
    expect(normalized.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('drops the removed foreground-only handsfree settings', () => {
    const normalized = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeForegroundOnly: true,
      handsFreeForegroundOnlyConfigured: true,
    } as AppConfig & {
      handsFreeForegroundOnly: boolean;
      handsFreeForegroundOnlyConfigured: boolean;
    });

    expect('handsFreeForegroundOnly' in normalized).toBe(false);
    expect('handsFreeForegroundOnlyConfigured' in normalized).toBe(false);
  });

  it('trims custom handsfree phrases', () => {
    const normalized = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeWakePhrase: '  hey desk agent  ',
      handsFreeSleepPhrase: '  go quiet  ',
      handsFreeSendPhrase: '  submit now  ',
    });

    expect(normalized.handsFreeWakePhrase).toBe('hey desk agent');
    expect(normalized.handsFreeSleepPhrase).toBe('go quiet');
    expect(normalized.handsFreeSendPhrase).toBe('submit now');
  });

  it('migrates the previous wake phrase default to Hi bro', () => {
    const normalized = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeWakePhrase: 'hey agents',
    });

    expect(normalized.handsFreeWakePhrase).toBe('Hi bro');
  });

  it('accepts arbitrary non-negative handsfree send delays while still rejecting negatives', () => {
    const tooLow = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeMessageDebounceMs: MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS - 200,
    });
    const customHighValue = 12345;
    const arbitraryHigh = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeMessageDebounceMs: customHighValue,
    });

    expect(tooLow.handsFreeMessageDebounceMs).toBe(MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS);
    expect(arbitraryHigh.handsFreeMessageDebounceMs).toBe(customHighValue);
  });

  it('migrates deprecated Edge TTS voices to the default', () => {
    // Microsoft removed en-US-DavisNeural from the consumer catalog; any
    // stored value pointing at it must be rewritten on load so existing users
    // do not hit a close code 1007 "Unsupported voice" at synthesis time.
    const migrated = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      edgeTtsVoice: 'en-US-DavisNeural',
    });

    expect(migrated.edgeTtsVoice).toBe('en-US-AriaNeural');
  });

  it('preserves still-supported Edge TTS voices', () => {
    const preserved = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      edgeTtsVoice: 'en-GB-SoniaNeural',
    });

    expect(preserved.edgeTtsVoice).toBe('en-GB-SoniaNeural');
  });

  it('falls back to native mobile STT when desktop STT is selected without pairing', () => {
    const normalized = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      baseUrl: '',
      apiKey: '',
      mobileSttProvider: 'desktop',
    });

    expect(normalized.mobileSttProvider).toBe('native');
  });

  it('preserves desktop mobile STT when a desktop is paired', () => {
    const normalized = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      baseUrl: 'https://desktop.example/v1',
      apiKey: 'test-key',
      mobileSttProvider: 'desktop',
    });

    expect(normalized.mobileSttProvider).toBe('desktop');
  });
});
