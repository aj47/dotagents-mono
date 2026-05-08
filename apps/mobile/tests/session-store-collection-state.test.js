const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sessionStoreSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'store', 'sessions.ts'),
  'utf8'
);

test('uses shared collection state helpers for mobile session set state', () => {
  assert.match(sessionStoreSource, /setDeletingSessionIds\(prev => addSetValue\(prev, id\)\)/);
  assert.match(sessionStoreSource, /setDeletingSessionIds\(prev => removeSetValue\(prev, id\)\)/);
  assert.match(sessionStoreSource, /setSetValuePresence\(\s*serverPinnedIds,\s*toggledSession\.serverConversationId,\s*Boolean\(toggledSession\.isPinned\),\s*\)/);
  assert.match(sessionStoreSource, /setSetValuePresence\(\s*serverArchivedIds,\s*toggledSession\.serverConversationId,\s*Boolean\(toggledSession\.isArchived\),\s*\)/);

  assert.doesNotMatch(sessionStoreSource, /setDeletingSessionIds\(prev => new Set\(prev\)\.add\(id\)\)/);
  assert.doesNotMatch(sessionStoreSource, /serverPinnedIds\.(add|delete)\(toggledSession\.serverConversationId\)/);
  assert.doesNotMatch(sessionStoreSource, /serverArchivedIds\.(add|delete)\(toggledSession\.serverConversationId\)/);
});
