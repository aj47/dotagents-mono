const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('mobile full-history viewer marks where the active context window begins', () => {
  assert.match(
    chatScreenSource,
    /const fullHistoryBoundaryIndex = hasStoredFullHistory && messages.length > 0\s+\? visibleMessages.length - messages.length\s+: null;/
  );
  assert.match(
    chatScreenSource,
    /showFullHistory && fullHistoryBoundaryIndex !== null && i === fullHistoryBoundaryIndex/
  );
  assert.match(chatScreenSource, /Active context window starts here\./);
  assert.match(chatScreenSource, /style=\{styles\.fullHistoryDivider\}/);
});