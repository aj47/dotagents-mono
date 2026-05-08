const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses shared knowledge note list helpers for mobile settings state updates', () => {
  assert.match(settingsSource, /removeKnowledgeNoteFromList\(prev, noteId\)/);
  assert.match(settingsSource, /removeKnowledgeNotesFromList\(prev, ids\)/);
  assert.match(settingsSource, /const promotedAt = Date\.now\(\)/);
  assert.match(settingsSource, /setKnowledgeNoteContextInList\(prev, note\.id, 'auto', promotedAt\)/);
  assert.doesNotMatch(settingsSource, /prev\.filter\(note => note\.id !== noteId\)/);
  assert.doesNotMatch(settingsSource, /prev\.filter\(note => !deletedIds\.has\(note\.id\)\)/);
  assert.doesNotMatch(settingsSource, /existing\.id === note\.id[\s\S]*updatedAt: Date\.now\(\)/);
});
