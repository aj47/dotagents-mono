import { describe, expect, it } from 'vitest';
import { matchSleepPhrase, matchWakePhrase, normalizeVoicePhrase } from '@dotagents/shared/voice-phrase-matcher';

describe('normalizeVoicePhrase', () => {
  it('normalizes punctuation, apostrophes, and spacing', () => {
    expect(normalizeVoicePhrase(" Hey, Dot-Agents!!  ")).toBe('hey dot agents');
    expect(normalizeVoicePhrase("what’s up?")).toBe('whats up');
  });
});

describe('matchWakePhrase', () => {
  it('matches the wake phrase on its own', () => {
    expect(matchWakePhrase('Hey Dot Agents', 'hey dot agents')).toEqual({
      matched: true,
      normalizedTranscript: 'hey dot agents',
      normalizedPhrase: 'hey dot agents',
      remainder: '',
    });
  });

  it('strips the wake phrase when a request follows it', () => {
    expect(matchWakePhrase('Hey dot agents, what is on my calendar today?', 'hey dot agents')).toEqual({
      matched: true,
      normalizedTranscript: 'hey dot agents what is on my calendar today',
      normalizedPhrase: 'hey dot agents',
      remainder: 'what is on my calendar today',
    });
  });

  it('does not match unrelated text', () => {
    expect(matchWakePhrase('tell me a joke', 'hey dot agents').matched).toBe(false);
  });
});

describe('matchSleepPhrase', () => {
  it('matches the sleep phrase exactly', () => {
    expect(matchSleepPhrase('Go to sleep', 'go to sleep').matched).toBe(true);
  });

  it('matches the sleep phrase at the end of a short utterance', () => {
    expect(matchSleepPhrase('okay go to sleep', 'go to sleep').matched).toBe(true);
  });
});
