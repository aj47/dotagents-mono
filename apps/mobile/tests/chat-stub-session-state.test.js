const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('explains when a synced chat cannot load without connection settings', () => {
  assert.match(screenSource, /Synced chat needs connection settings/);
  assert.match(screenSource, /Connect this mobile app to DotAgents to load synced chats from desktop\./);
  assert.match(screenSource, /navigation\.navigate\('ConnectionSettings'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\([\s\S]*?'Open connection settings'/);
  assert.match(screenSource, /Opens connection settings so this mobile app can load synced chat history\./);
});

test('keeps failed synced-chat loads actionable with an in-place retry', () => {
  assert.match(screenSource, /Couldn’t load synced chat history/);
  assert.match(screenSource, /Couldn’t load this synced chat from desktop\. Check your connection and retry\./);
  assert.match(screenSource, /void loadStubSessionMessages\(activeStubSessionNotice\.sessionId\);/);
  assert.match(screenSource, /createButtonAccessibilityLabel\([\s\S]*?'Retry loading synced chat'/);
  assert.match(screenSource, /Attempts to load the current synced chat history from desktop again\./);
});

