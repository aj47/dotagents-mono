import { describe, expect, it } from 'vitest';
import {
  mergeVoiceText,
  normalizeAutoTtsTextKey,
  normalizeVoiceText,
} from './voice-text-utils';

describe('voice text utilities', () => {
  it('normalizes whitespace for voice text and duplicate TTS keys', () => {
    expect(normalizeVoiceText('  hello\n  world\t')).toBe('hello world');
    expect(normalizeAutoTtsTextKey('  Hello\nWORLD  ')).toBe('hello world');
  });

  it('keeps cumulative recognizer results from duplicating words', () => {
    expect(mergeVoiceText('hello', 'hello world')).toBe('hello world');
  });

  it('merges overlapping transcript chunks without repeating the overlap', () => {
    expect(mergeVoiceText('turn on', 'on the lights')).toBe('turn on the lights');
  });

  it('keeps a whole-phrase duplicate when recognizers resend a prior chunk', () => {
    expect(mergeVoiceText('make coffee now', 'coffee')).toBe('make coffee now');
    expect(mergeVoiceText('coffee', 'make coffee now')).toBe('make coffee now');
  });

  it('preserves non-overlapping chunks in order', () => {
    expect(mergeVoiceText('summarize my', 'latest emails')).toBe('summarize my latest emails');
  });
});
