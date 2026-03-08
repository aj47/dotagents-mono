const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('keeps the new-chat entry path explicit about which current routing context it will use', () => {
  assert.match(screenSource, /const newChatTargetDescription = isAcpMainAgentMode[\s\S]*?`the current main agent "\$\{currentAgentLabel\}"`[\s\S]*?`the current profile "\$\{currentAgentLabel\}"`;/);
  assert.match(screenSource, /const newChatAccessibilityHint = `Creates and opens a new chat using \$\{newChatTargetDescription\}\.`;/);
  assert.match(screenSource, /const emptyStateSubtitle = `Start a new chat using \$\{newChatTargetDescription\}\.`;/);
  assert.match(screenSource, /<Text style=\{styles\.emptySubtitle\}>\{emptyStateSubtitle\}<\/Text>/);
  assert.match(screenSource, /accessibilityHint=\{newChatAccessibilityHint\}/);
  assert.match(screenSource, /<Text style=\{styles\.newButtonText\}>\+ New Chat<\/Text>/);
});