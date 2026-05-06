import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

import {
  DEFAULT_APP_CONFIG,
  normalizeStoredConfig,
} from './config';
import {
  DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  DEFAULT_HANDS_FREE_WAKE_PHRASE,
  MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
} from '@dotagents/shared/mobile-app-config';

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
    expect(normalized.handsFreeDebug).toBe(DEFAULT_APP_CONFIG.handsFreeDebug);
    expect(normalized.handsFreeForegroundOnly).toBe(DEFAULT_APP_CONFIG.handsFreeForegroundOnly);
    expect(normalized.baseUrl).toBe('https://api.openai.com/v1');
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
});
