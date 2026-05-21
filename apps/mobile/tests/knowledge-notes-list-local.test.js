const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

const mobileClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);

const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

const sharedApiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8'
);

test('mobile knowledge notes list restores search, filters, selection, and bulk actions locally', () => {
  assert.match(settingsSource, /const \[knowledgeNoteSearchQuery, setKnowledgeNoteSearchQuery\]/);
  assert.match(settingsSource, /KNOWLEDGE_NOTE_CONTEXT_FILTER_OPTIONS/);
  assert.match(settingsSource, /KNOWLEDGE_NOTE_DATE_FILTER_OPTIONS/);
  assert.match(settingsSource, /KNOWLEDGE_NOTE_SORT_OPTIONS/);
  assert.match(settingsSource, /settingsClient\.getKnowledgeNotes\(knowledgeNoteFilterRequest\)/);
  assert.match(settingsSource, /settingsClient\.searchKnowledgeNotes\(\{/);
  assert.match(settingsSource, /selectedKnowledgeNoteIds/);
  assert.match(settingsSource, /handleKnowledgeNoteSelectVisible/);
  assert.match(settingsSource, /handleKnowledgeNoteDeleteMultiple/);
  assert.match(settingsSource, /handleKnowledgeNoteDeleteAll/);
  assert.match(settingsSource, /Delete selected/);
  assert.match(settingsSource, /Delete all notes/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(settingsSource, /knowledge-note-groups/);
});

test('knowledge note list API stays on the mobile client and remote settings server boundary', () => {
  assert.match(mobileClientSource, /export interface KnowledgeNotesQuery/);
  assert.match(mobileClientSource, /async getKnowledgeNotes\(query\?: KnowledgeNotesQuery\)/);
  assert.match(mobileClientSource, /new URLSearchParams/);
  assert.match(mobileClientSource, /async searchKnowledgeNotes\(query: KnowledgeNotesQuery\)/);
  assert.match(mobileClientSource, /async deleteKnowledgeNotes\(ids: string\[\]\)/);
  assert.match(mobileClientSource, /async deleteAllKnowledgeNotes\(\)/);

  assert.match(remoteServerSource, /const parseKnowledgeNoteFilter = \(raw: unknown\)/);
  assert.match(remoteServerSource, /fastify\.post\("\/v1\/knowledge\/notes\/search"/);
  assert.match(remoteServerSource, /fastify\.post\("\/v1\/knowledge\/notes\/delete"/);
  assert.match(remoteServerSource, /fastify\.post\("\/v1\/knowledge\/notes\/delete-all"/);
  assert.match(remoteServerSource, /knowledgeNotesService\.searchNotes\(query, filter\)/);
  assert.match(remoteServerSource, /knowledgeNotesService\.deleteMultipleNotes\(ids\)/);
  assert.match(remoteServerSource, /knowledgeNotesService\.deleteAllNotes\(\)/);

  assert.doesNotMatch(sharedApiTypesSource, /KnowledgeNotesQuery/);
  assert.doesNotMatch(sharedApiTypesSource, /KnowledgeNotesDeleteMultipleResponse/);
});
