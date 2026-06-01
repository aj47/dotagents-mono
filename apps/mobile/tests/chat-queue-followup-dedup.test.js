const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('mobile chat derives a single visibility flag for the queue panel (#527)', () => {
  assert.match(
    source,
    /const messageQueuePanelVisible = messageQueueEnabled && queuedMessages\.length > 0;/,
  );
});

test('mobile chat suppresses inline "Follow-up queued" bubbles when the queue panel is visible (#527)', () => {
  assert.match(
    source,
    /\{!messageQueuePanelVisible && pendingQueuedMessages\.map\(\(queuedMessage\) => \(/,
  );
  assert.doesNotMatch(
    source,
    /^\s*\{pendingQueuedMessages\.map\(\(queuedMessage\) => \($/m,
  );
});

test('mobile MessageQueuePanel renders behind the shared visibility flag (#527)', () => {
  assert.match(
    source,
    /\{messageQueuePanelVisible && \(\s*\n\s*<View style=\{\{ paddingHorizontal: spacing\.md, paddingTop: spacing\.sm \}\}>/,
  );
  assert.doesNotMatch(
    source,
    /\{messageQueueEnabled && queuedMessages\.length > 0 && \(\s*\n\s*<View style=\{\{ paddingHorizontal: spacing\.md, paddingTop: spacing\.sm \}\}>/,
  );
});
