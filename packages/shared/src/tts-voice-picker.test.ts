import { describe, expect, it } from 'vitest';

import {
  isEnglishTtsVoice,
  isGoogleChromeTtsVoice,
  pickPreferredWebGoogleVoice,
  sortVoicesForTtsPicker,
  type TtsVoiceLike,
} from './tts-voice-picker';

const voice = (name: string, overrides: Partial<TtsVoiceLike> = {}): TtsVoiceLike => ({
  identifier: name,
  name,
  ...overrides,
});

describe('tts-voice-picker', () => {
  it('detects English and Google Chrome voices from native/web voice metadata', () => {
    expect(isEnglishTtsVoice(voice('Alex', { language: 'en-US' }))).toBe(true);
    expect(isEnglishTtsVoice(voice('Amelie', { language: 'fr-FR' }))).toBe(false);
    expect(isGoogleChromeTtsVoice(voice('Google US English'))).toBe(true);
    expect(isGoogleChromeTtsVoice(voice('US English', { identifier: 'google-voice-1' }))).toBe(true);
    expect(isGoogleChromeTtsVoice(voice('Samantha'))).toBe(false);
  });

  it('sorts English enhanced US voices ahead of lower-priority voices', () => {
    const sorted = sortVoicesForTtsPicker([
      voice('French', { language: 'fr-FR' }),
      voice('US Standard', { language: 'en-US' }),
      voice('UK Enhanced', { language: 'en-GB', quality: 'Enhanced' }),
      voice('US Enhanced', { language: 'en-US', quality: 'Enhanced' }),
    ]);

    expect(sorted.map((entry) => entry.name)).toEqual([
      'US Enhanced',
      'US Standard',
      'UK Enhanced',
      'French',
    ]);
  });

  it('can prefer Google voices for web voice pickers', () => {
    const sorted = sortVoicesForTtsPicker([
      voice('US Enhanced', { language: 'en-US', quality: 'Enhanced' }),
      voice('Google UK English Female', { language: 'en-GB' }),
    ], { preferGoogleVoices: true });

    expect(sorted[0].name).toBe('Google UK English Female');
  });

  it('picks the preferred Google US voice before fallback Google voices', () => {
    expect(pickPreferredWebGoogleVoice([
      voice('Google UK English Female', { language: 'en-GB' }),
      voice('Google US English', { language: 'en-US' }),
    ])?.name).toBe('Google US English');
  });

  it('falls back to the best Google voice when preferred names are unavailable', () => {
    expect(pickPreferredWebGoogleVoice([
      voice('Samantha', { language: 'en-US', quality: 'Enhanced' }),
      voice('Google Nederlands', { language: 'nl-NL' }),
      voice('Google Canada English', { language: 'en-CA' }),
    ])?.name).toBe('Google Canada English');
  });

  it('returns null when no Google voice is available', () => {
    expect(pickPreferredWebGoogleVoice([
      voice('Samantha', { language: 'en-US' }),
      voice('Alex', { language: 'en-US' }),
    ])).toBeNull();
  });
});
