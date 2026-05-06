import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  DEFAULT_HANDS_FREE_WAKE_PHRASE,
  DEFAULT_MOBILE_APP_CONFIG,
  MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  normalizeMobileStoredConfig,
} from './mobile-app-config';

describe('normalizeMobileStoredConfig', () => {
  it('backfills the handsfree defaults for older configs', () => {
    const normalized = normalizeMobileStoredConfig({
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

  it('trims custom handsfree phrases', () => {
    const normalized = normalizeMobileStoredConfig({
      ...DEFAULT_MOBILE_APP_CONFIG,
      handsFreeWakePhrase: '  hey desk agent  ',
      handsFreeSleepPhrase: '  go quiet  ',
    });

    expect(normalized.handsFreeWakePhrase).toBe('hey desk agent');
    expect(normalized.handsFreeSleepPhrase).toBe('go quiet');
  });

  it('accepts arbitrary non-negative handsfree send delays while still rejecting negatives', () => {
    const tooLow = normalizeMobileStoredConfig({
      ...DEFAULT_MOBILE_APP_CONFIG,
      handsFreeMessageDebounceMs: MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS - 200,
    });
    const customHighValue = 12345;
    const arbitraryHigh = normalizeMobileStoredConfig({
      ...DEFAULT_MOBILE_APP_CONFIG,
      handsFreeMessageDebounceMs: customHighValue,
    });

    expect(tooLow.handsFreeMessageDebounceMs).toBe(MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS);
    expect(arbitraryHigh.handsFreeMessageDebounceMs).toBe(customHighValue);
  });

  it('migrates deprecated Edge TTS voices to the default', () => {
    const migrated = normalizeMobileStoredConfig({
      ...DEFAULT_MOBILE_APP_CONFIG,
      edgeTtsVoice: 'en-US-DavisNeural',
    });

    expect(migrated.edgeTtsVoice).toBe('en-US-AriaNeural');
  });

  it('preserves still-supported Edge TTS voices', () => {
    const preserved = normalizeMobileStoredConfig({
      ...DEFAULT_MOBILE_APP_CONFIG,
      edgeTtsVoice: 'en-GB-SoniaNeural',
    });

    expect(preserved.edgeTtsVoice).toBe('en-GB-SoniaNeural');
  });

  it('falls back from Edge TTS to native when no desktop pairing exists', () => {
    expect(normalizeMobileStoredConfig({
      ...DEFAULT_MOBILE_APP_CONFIG,
      apiKey: '',
      baseUrl: '',
      ttsProvider: 'edge',
    }).ttsProvider).toBe('native');
  });

  it('preserves the shared audio input device selection', () => {
    const normalized = normalizeMobileStoredConfig({
      ...DEFAULT_MOBILE_APP_CONFIG,
      audioInputDeviceId: 'microphone-1',
    });

    expect(normalized.audioInputDeviceId).toBe('microphone-1');
  });
});
