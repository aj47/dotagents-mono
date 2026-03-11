import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import {
  CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE,
  DEFAULT_APP_CONFIG,
  DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  DEFAULT_HANDS_FREE_WAKE_PHRASE,
  hasConfiguredConnection,
  MAX_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  normalizeStoredConfig,
} from './config';

describe('normalizeStoredConfig', () => {
  it('backfills the handsfree defaults for older configs', () => {
    const normalized = normalizeStoredConfig({
      apiKey: 'test',
      baseUrl: 'https://api.openai.com/v1/',
      model: 'gpt-4.1-mini',
    });

    expect(normalized.handsFree).toBe(false);
    expect(normalized.handsFreeMessageDebounceMs).toBe(DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS);
    expect(normalized.handsFreeWakePhrase).toBe(DEFAULT_HANDS_FREE_WAKE_PHRASE);
    expect(normalized.handsFreeSleepPhrase).toBe(DEFAULT_HANDS_FREE_SLEEP_PHRASE);
    expect(normalized.handsFreeDebug).toBe(false);
    expect(normalized.handsFreeForegroundOnly).toBe(true);
    expect(normalized.baseUrl).toBe('https://api.openai.com/v1');
  });

  it('trims stored API keys so whitespace-only credentials stay disconnected', () => {
    const normalized = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      apiKey: '   ',
      baseUrl: 'https://api.openai.com/v1',
    });

    expect(normalized.apiKey).toBe('');
    expect(hasConfiguredConnection(normalized)).toBe(false);
  });

  it('trims custom handsfree phrases', () => {
    const normalized = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeWakePhrase: '  hey desk agent  ',
      handsFreeSleepPhrase: '  go quiet  ',
    });

    expect(normalized.handsFreeWakePhrase).toBe('hey desk agent');
    expect(normalized.handsFreeSleepPhrase).toBe('go quiet');
  });

  it('clamps the handsfree send delay to a safe range', () => {
    const tooLow = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeMessageDebounceMs: MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS - 200,
    });
    const tooHigh = normalizeStoredConfig({
      ...DEFAULT_APP_CONFIG,
      handsFreeMessageDebounceMs: MAX_HANDS_FREE_MESSAGE_DEBOUNCE_MS + 200,
    });

    expect(tooLow.handsFreeMessageDebounceMs).toBe(MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS);
    expect(tooHigh.handsFreeMessageDebounceMs).toBe(MAX_HANDS_FREE_MESSAGE_DEBOUNCE_MS);
  });
});

describe('hasConfiguredConnection', () => {
  it('accepts trimmed API key and base URL values', () => {
    expect(hasConfiguredConnection({
      apiKey: '  sk-test  ',
      baseUrl: '  https://example.com/v1  ',
    })).toBe(true);
  });

  it('rejects missing or whitespace-only credentials', () => {
    expect(hasConfiguredConnection({
      apiKey: '   ',
      baseUrl: 'https://example.com/v1',
    })).toBe(false);
    expect(hasConfiguredConnection({
      apiKey: 'sk-test',
      baseUrl: '   ',
    })).toBe(false);
  });

  it('keeps the missing-connection guidance copy stable', () => {
    expect(CHAT_CONNECTION_SETTINGS_REQUIRED_MESSAGE).toBe('Add your API key in Connection settings before starting a chat.');
  });
});
