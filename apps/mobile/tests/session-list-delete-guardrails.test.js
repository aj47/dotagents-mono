const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('session list delete confirmations no longer rely on raw window.confirm calls', () => {
  assert.match(source, /const confirmDestructiveAction = \(/);
  assert.match(source, /const confirmFn = \(globalThis as \{ confirm\?: \(text\?: string\) => boolean \}\)\.confirm/);
  assert.match(source, /Alert\.alert\(title, message, \[/);
  assert.doesNotMatch(source, /window\.confirm\(/);
});

test('session deletes await persistence and surface failures explicitly', () => {
  assert.match(source, /await sessionStore\.deleteSession\(session\.id\);/);
  assert.match(source, /console\.error\('\[SessionListScreen\] Failed to delete session:', error\);/);
  assert.match(source, /Alert\.alert\(\s*'Delete Failed',/);
  assert.match(source, /await sessionStore\.clearAllSessions\(\);/);
  assert.match(source, /console\.error\('\[SessionListScreen\] Failed to clear all sessions:', error\);/);
  assert.match(source, /Alert\.alert\(\s*'Clear All Failed',/);
});

test('session rows and clear-all action expose delete-in-progress guardrails', () => {
  assert.match(source, /const hasPendingSessionDeletion = sessionStore\.deletingSessionIds\.size > 0;/);
  assert.match(source, /const isDeletingSession = sessionStore\.deletingSessionIds\.has\(item\.id\);/);
  assert.match(source, /onLongPress=\{!hasPendingSessionDeletion \? \(\) => handleDeleteSession\(item\) : undefined\}/);
  assert.match(source, /disabled=\{isDeletingSession\}/);
  assert.match(source, /accessibilityState=\{\{ selected: isActive, disabled: isDeletingSession, busy: isDeletingSession \}\}/);
  assert.match(source, /hasPendingSessionDeletion && styles\.sessionActionDisabled/);
  assert.match(source, /accessibilityState=\{\{ disabled: hasPendingSessionDeletion, busy: hasPendingSessionDeletion \}\}/);
  assert.match(source, /\? 'Deleting chat\.\.\.'/);
});