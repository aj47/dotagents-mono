import { describe, expect, it } from 'vitest';
import { mergeVoiceText } from './mergeVoiceText';

describe('mergeVoiceText', () => {
  it('keeps cumulative recognizer results from duplicating words', () => {
    expect(mergeVoiceText('hello', 'hello world')).toBe('hello world');
  });

  it('merges overlapping transcript chunks without repeating the overlap', () => {
    expect(mergeVoiceText('turn on', 'on the lights')).toBe('turn on the lights');
  });

  it('preserves non-overlapping chunks in order', () => {
    expect(mergeVoiceText('summarize my', 'latest emails')).toBe('summarize my latest emails');
  });
});
