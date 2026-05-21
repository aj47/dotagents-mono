const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SplitChatScreen.tsx'),
  'utf8'
);

test('uses mobile icons for split chat toolbar and pane actions', () => {
  assert.match(screenSource, /import \{ Ionicons \} from '@expo\/vector-icons';/);
  assert.match(screenSource, /name="list-outline"/);
  assert.match(screenSource, /name="expand-outline"/);
  assert.match(screenSource, /name="chatbubbles-outline"/);
  assert.match(screenSource, /name="add-circle-outline"/);
  assert.match(screenSource, /toolbarButton:\s*\{[\s\S]*?flexDirection:\s*'row'[\s\S]*?gap:\s*4/);
  assert.match(screenSource, /primaryButton:\s*\{[\s\S]*?flexDirection:\s*'row'[\s\S]*?gap:\s*spacing\.xs/);
  assert.match(screenSource, /secondaryButton:\s*\{[\s\S]*?flexDirection:\s*'row'[\s\S]*?gap:\s*spacing\.xs/);
});

test('keeps split orientation controls accessible and stable under touch', () => {
  assert.match(screenSource, /accessibilityState=\{\{ selected: isSelected \}\}/);
  assert.match(screenSource, /pressed && styles\.segmentButtonPressed/);
  assert.match(screenSource, /segmentButtonPressed:\s*\{\s*opacity:\s*0\.78\s*\}/);
});
