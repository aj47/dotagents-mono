const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'store', 'sessions.ts'),
  'utf8'
);

test('mobile session storage sanitizes malformed persisted sessions before screens consume them', () => {
  assert.match(source, /function sanitizeStoredSessions\(value: unknown\): \{ sessions: Session\[\]; changed: boolean \}/);
  assert.match(source, /const rawMessages = Array\.isArray\(value\.messages\) \? value\.messages : \[\]/);
  assert.match(source, /const seenSessionIds = new Set<string>\(\)/);
  assert.match(source, /sanitizeStoredMessage\(message, fallbackTimestamp \+ index\)/);
  assert.match(source, /firstUserMessage\?\.content[\s\S]*generateSessionTitle\(firstUserMessage\.content\)/);
});

test('mobile session storage rewrites sanitized data and clears corrupt JSON instead of retrying bad state forever', () => {
  assert.match(source, /Stored sessions were invalid or outdated; rewriting sanitized data/);
  assert.match(source, /await AsyncStorage\.setItem\(SESSIONS_KEY, JSON\.stringify\(sessions\)\);/);
  assert.match(source, /Failed to parse stored sessions; clearing corrupt data/);
  assert.match(source, /await AsyncStorage\.removeItem\(SESSIONS_KEY\);/);
});

test('mobile session storage recovers stale current-session pointers to a valid session instead of forcing a blank new chat', () => {
  assert.match(source, /function resolveStoredCurrentSessionId\([\s\S]*currentSessionId: string \| null,[\s\S]*\): string \| null/);
  assert.match(source, /if \(!normalizedCurrentSessionId\) \{[\s\S]*return sessions\[0\]\.id;/);
  assert.match(source, /const recoveredCurrentId = resolveStoredCurrentSessionId\(loadedSessions, loadedCurrentId\);/);
  assert.match(source, /await saveCurrentSessionId\(recoveredCurrentId\);/);
});