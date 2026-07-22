import { describe, expect, it } from 'vitest';
import {
  matchesHandsFreeSendPhrase,
  resolveHandsFreeManualDraft,
} from './handsFreeManualSend';

describe('matchesHandsFreeSendPhrase', () => {
  it('matches the configured keyword exactly without case or punctuation sensitivity', () => {
    expect(matchesHandsFreeSendPhrase('Send!', 'send')).toBe(true);
    expect(matchesHandsFreeSendPhrase('OVER', 'over')).toBe(true);
  });

  it('does not send when the keyword is only part of dictated content', () => {
    expect(matchesHandsFreeSendPhrase('send this when ready', 'send')).toBe(false);
    expect(matchesHandsFreeSendPhrase('please send', 'send')).toBe(false);
  });

  it('does not match empty phrases', () => {
    expect(matchesHandsFreeSendPhrase('', 'send')).toBe(false);
    expect(matchesHandsFreeSendPhrase('send', '  ')).toBe(false);
  });
});

describe('resolveHandsFreeManualDraft', () => {
  it('accumulates separate finalized phrases without sending', () => {
    expect(resolveHandsFreeManualDraft('book a table', 'for tomorrow night', 'send')).toEqual({
      type: 'draft',
      text: 'book a table for tomorrow night',
    });
  });

  it('submits the existing draft when the exact keyword is spoken', () => {
    expect(resolveHandsFreeManualDraft('book a table for tomorrow', 'send', 'send')).toEqual({
      type: 'send',
      text: 'book a table for tomorrow',
    });
  });

  it('returns empty when the send keyword is spoken without a draft', () => {
    expect(resolveHandsFreeManualDraft('', 'send', 'send')).toEqual({ type: 'empty' });
  });
});
