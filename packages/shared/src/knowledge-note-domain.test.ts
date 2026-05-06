import { describe, expect, it } from 'vitest';

import {
  createReadableKnowledgeNoteId,
  slugifyKnowledgeNoteId,
} from './knowledge-note-domain';

describe('knowledge note domain helpers', () => {
  it('slugifies knowledge note ids consistently', () => {
    expect(slugifyKnowledgeNoteId('  Harness Strategy!  ')).toBe('harness-strategy');
    expect(slugifyKnowledgeNoteId('Daily / Weekly_Review', 12)).toBe('daily-weekly');
    expect(slugifyKnowledgeNoteId('!!!')).toBe('');
  });

  it('creates readable note ids from the first usable candidate', () => {
    expect(createReadableKnowledgeNoteId(['!!!', 'Harness Strategy'], () => 'abc123')).toBe('harness-strategy-abc123');
    expect(createReadableKnowledgeNoteId([undefined, ''], () => 'fallback')).toBe('note-fallback');
  });
});
