const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const syncServiceSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'syncService.ts'),
  'utf8'
);

const sharedSessionSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'session.ts'),
  'utf8'
);

test('stub-session sync preserves compaction metadata and active-window counts from the server list', () => {
  assert.match(syncServiceSource, /compaction: item\.compaction,/);
  assert.match(syncServiceSource, /activeMessageCount: item\.activeMessageCount,/);
  assert.match(syncServiceSource, /function refreshStubSessionFromServerListItem\(/);
  assert.match(syncServiceSource, /updatedSessions\[i\] = refreshStubSessionFromServerListItem\(session, serverItem\);/);
});

test('shared session list conversion prefers active-window counts for stub sessions', () => {
  assert.match(sharedSessionSource, /activeMessageCount\?: number;/);
  assert.match(
    sharedSessionSource,
    /messageCount: session\.serverMetadata\.activeMessageCount \?\? session\.serverMetadata\.messageCount,/,
  );
});