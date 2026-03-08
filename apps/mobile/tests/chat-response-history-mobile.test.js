const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('keeps repeated respond_to_user entries when they recur later instead of deduplicating the full session', () => {
  assert.match(chatScreenSource, /const appendRespondToUserHistoryEntry = \([\s\S]*?const trimmedResponseText = responseText\.trim\(\);/);
  assert.match(chatScreenSource, /const previousEntry = history\[history\.length - 1\];/);
  assert.match(chatScreenSource, /if \(previousEntry\?\.text === trimmedResponseText\) return history;/);
  assert.match(chatScreenSource, /return \[\.\.\.history, \{ text: trimmedResponseText, timestamp \}\];/);
  assert.doesNotMatch(chatScreenSource, /const seenResponses = new Set<string>\(\);/);
  assert.doesNotMatch(chatScreenSource, /prev\.some\(\(entry\) => entry\.text === responseText\)/);
});

test('reuses the consecutive-duplicate guard for saved history extraction and live progress updates', () => {
  assert.match(chatScreenSource, /history = appendRespondToUserHistoryEntry\(history, responseText, messageTimestamp\);/);
  assert.match(chatScreenSource, /setRespondToUserHistory\(\(prev\) => appendRespondToUserHistoryEntry\(prev, responseText, Date\.now\(\)\)\);/);
  assert.match(chatScreenSource, /Keep repeated replies when they recur later, while skipping immediate duplicates\./);
});