import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  DEFAULT_HANDS_FREE_SLEEP_PHRASE,
  DEFAULT_HANDS_FREE_WAKE_PHRASE,
  MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS,
  createInitialHandsFreeState,
  matchSleepPhrase,
  matchWakePhrase,
  normalizeHandsFreeConfig,
  normalizeVoicePhrase,
  resolveHandsFreeUtterance,
} from './hands-free';

describe('normalizeHandsFreeConfig', () => {
  it('backfills defaults and normalizes phrases', () => {
    const normalized = normalizeHandsFreeConfig({
      handsFreeWakePhrase: '  hey desk agent  ',
      handsFreeSleepPhrase: '  go quiet  ',
    });

    expect(normalized.handsFree).toBe(false);
    expect(normalized.handsFreeMessageDebounceMs).toBe(DEFAULT_HANDS_FREE_MESSAGE_DEBOUNCE_MS);
    expect(normalized.handsFreeWakePhrase).toBe('hey desk agent');
    expect(normalized.handsFreeSleepPhrase).toBe('go quiet');
    expect(normalized.handsFreeDebug).toBe(false);
    expect(normalized.handsFreeForegroundOnly).toBe(true);
    expect(normalized.handsFreeForegroundOnlyConfigured).toBe(false);
  });

  it('accepts non-negative send delays and rejects negatives', () => {
    expect(normalizeHandsFreeConfig({
      handsFreeMessageDebounceMs: MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS - 200,
    }).handsFreeMessageDebounceMs).toBe(MIN_HANDS_FREE_MESSAGE_DEBOUNCE_MS);

    expect(normalizeHandsFreeConfig({
      handsFreeMessageDebounceMs: 12345,
    }).handsFreeMessageDebounceMs).toBe(12345);
  });
});

describe('normalizeVoicePhrase', () => {
  it('normalizes punctuation, apostrophes, and spacing', () => {
    expect(normalizeVoicePhrase(" Hey, Dot-Agents!!  ")).toBe('hey dot agents');
    expect(normalizeVoicePhrase("what\u2019s up?")).toBe('whats up');
  });
});

describe('matchWakePhrase', () => {
  it('matches the wake phrase on its own', () => {
    expect(matchWakePhrase('Hey Dot Agents', DEFAULT_HANDS_FREE_WAKE_PHRASE)).toEqual({
      matched: true,
      normalizedTranscript: 'hey dot agents',
      normalizedPhrase: 'hey dot agents',
      remainder: '',
    });
  });

  it('strips the wake phrase when a request follows it', () => {
    expect(matchWakePhrase('Hey dot agents, what is on my calendar today?', DEFAULT_HANDS_FREE_WAKE_PHRASE)).toEqual({
      matched: true,
      normalizedTranscript: 'hey dot agents what is on my calendar today',
      normalizedPhrase: 'hey dot agents',
      remainder: 'what is on my calendar today',
    });
  });

  it('does not match unrelated text', () => {
    expect(matchWakePhrase('tell me a joke', DEFAULT_HANDS_FREE_WAKE_PHRASE).matched).toBe(false);
  });
});

describe('matchSleepPhrase', () => {
  it('matches the sleep phrase exactly', () => {
    expect(matchSleepPhrase('Go to sleep', DEFAULT_HANDS_FREE_SLEEP_PHRASE).matched).toBe(true);
  });

  it('matches the sleep phrase at the end of a short utterance', () => {
    expect(matchSleepPhrase('okay go to sleep', DEFAULT_HANDS_FREE_SLEEP_PHRASE).matched).toBe(true);
  });
});

describe('resolveHandsFreeUtterance', () => {
  it('sends a request after the wake phrase when sleeping', () => {
    const result = resolveHandsFreeUtterance({
      state: createInitialHandsFreeState(),
      transcript: 'hey dot agents what is on my calendar',
      wakePhrase: DEFAULT_HANDS_FREE_WAKE_PHRASE,
      sleepPhrase: DEFAULT_HANDS_FREE_SLEEP_PHRASE,
      now: 100,
    });

    expect(result.action).toEqual({ type: 'send', text: 'what is on my calendar' });
    expect(result.nextState.phase).toBe('processing');
    expect(result.matchedWake).toBe(true);
  });
});
