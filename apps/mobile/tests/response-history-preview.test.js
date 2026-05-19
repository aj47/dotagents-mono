const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ResponseHistoryPanel.tsx'),
  'utf8'
);

test('mobile response history keeps a compact collapsed preview', () => {
  assert.match(source, /const latestResponse = responses\[responses\.length - 1\] \?\? null/);
  assert.match(source, /const collapsedPreviewText = latestResponse\?\.text\.replace/);
  assert.match(source, /style=\{styles\.collapsedPreview\}/);
  assert.match(source, /numberOfLines=\{2\}/);
  assert.match(source, /styles\.collapsedTimestamp/);
});
