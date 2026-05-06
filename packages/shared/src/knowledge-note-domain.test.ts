import { describe, expect, it } from 'vitest';

import {
  buildKnowledgeNoteSearchIndex,
  createReadableKnowledgeNoteId,
  matchesKnowledgeNoteDateFilter,
  normalizeKnowledgeNoteForStorage,
  scoreKnowledgeNoteSearchEntry,
  slugifyKnowledgeNoteId,
  sortKnowledgeNotes,
} from './knowledge-note-domain';
import type { KnowledgeNote } from './knowledge-note-domain';

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

  it('normalizes notes for shared desktop and mobile storage contracts', () => {
    const note = normalizeKnowledgeNoteForStorage({
      id: '',
      title: '  Harness\nStrategy  ',
      context: 'auto',
      createdAt: Number.NaN,
      updatedAt: Number.NaN,
      tags: [' strategy ', 'strategy', '', 'evals'],
      references: [' conv_1 ', 'conv_1'],
      group: ' research\\harness ',
      series: ' weekly summaries ',
      entryType: 'entry',
      summary: '  Keep this\nnearby. ',
      body: 'Body text\n\n<!-- dotagents-memory-meta: legacy -->',
    }, { now: 1234, createSuffix: () => 'unused' });

    expect(note).toEqual({
      id: 'harness-strategy',
      title: 'Harness Strategy',
      context: 'auto',
      createdAt: 1234,
      updatedAt: 1234,
      tags: ['strategy', 'evals'],
      references: ['conv_1'],
      group: 'research/harness',
      series: 'weekly summaries',
      entryType: 'entry',
      summary: 'Keep this nearby.',
      body: 'Body text',
    });
  });

  it('shares note date filtering and sort order rules', () => {
    const now = 2_000_000;
    const notes = [
      { id: 'beta', title: 'Beta', context: 'auto', body: 'B', tags: [], createdAt: now - 10, updatedAt: now - 2 },
      { id: 'alpha', title: 'Alpha', context: 'auto', body: 'A', tags: [], createdAt: now - 20, updatedAt: now - 60 * 24 * 60 * 60 * 1000 },
      { id: 'gamma', title: 'Gamma', context: 'auto', body: 'G', tags: [], createdAt: now - 30, updatedAt: now - 1 },
    ] satisfies KnowledgeNote[];

    expect(matchesKnowledgeNoteDateFilter(notes[0], '7d', now)).toBe(true);
    expect(matchesKnowledgeNoteDateFilter(notes[1], '7d', now)).toBe(false);
    expect(sortKnowledgeNotes(notes, 'title-asc').map((note) => note.id)).toEqual(['alpha', 'beta', 'gamma']);
    expect(sortKnowledgeNotes(notes, 'created-desc').map((note) => note.id)).toEqual(['beta', 'alpha', 'gamma']);
  });

  it('shares fuzzy note search scoring and relevance ranking', () => {
    const notes = [
      {
        id: 'harness-strategy',
        title: 'Harness Engineering Strategy',
        context: 'search-only',
        updatedAt: 20,
        tags: ['strategy'],
        body: 'Direction for harness engineering and evaluation work.',
      },
      {
        id: 'random',
        title: 'Random Note',
        context: 'search-only',
        updatedAt: 30,
        tags: [],
        body: 'A weaker body-only mention of harness work.',
      },
    ] satisfies KnowledgeNote[];
    const scores = new Map<string, number>();
    const matches = buildKnowledgeNoteSearchIndex(notes)
      .filter((entry) => {
        const score = scoreKnowledgeNoteSearchEntry(entry, 'harnes enginering');
        if (score <= 0) return false;
        scores.set(entry.note.id, score);
        return true;
      })
      .map((entry) => entry.note);

    expect(sortKnowledgeNotes(matches, 'relevance', scores).map((note) => note.id)).toEqual(['harness-strategy']);
  });
});
