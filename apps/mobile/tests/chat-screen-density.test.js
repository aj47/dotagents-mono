const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('keeps agent selection in the navigation header for the mobile chat screen', () => {
  assert.match(screenSource, /headerTitle:\s*\(\) => \(/);
  assert.match(screenSource, /accessibilityLabel=\{`Current agent: \$\{currentAgentLabel\}\. Tap to change\.`\}/);
  assert.match(screenSource, /\{currentAgentLabel\} ▼/);
});

test('does not render a duplicate composer agent chip above the mobile chat input row', () => {
  assert.doesNotMatch(screenSource, /styles\.agentSelectorRow/);
  assert.doesNotMatch(screenSource, /🤖 Agent/);
  assert.doesNotMatch(screenSource, /agentSelectorChip(Label|Value)?:/);
});