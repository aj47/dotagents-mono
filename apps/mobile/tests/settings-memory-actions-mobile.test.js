const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('adds an explicit edit affordance to each memory row', () => {
  assert.match(settingsSource, /onPress=\{\(\) => handleMemoryEdit\(memory\)\}[\s\S]*?accessibilityRole="button"/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Edit \$\{memory\.title\} memory`\)/);
  assert.match(settingsSource, /accessibilityHint="Opens this memory so you can review and change what the agent remembers\."/);
  assert.match(settingsSource, /renderInlineEditAffordance\(\)/);
});

test('gives memory delete actions explicit button semantics and a mobile-sized target', () => {
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{memory\.title\} memory`\)/);
  assert.match(settingsSource, /accessibilityHint="Removes this memory after confirmation\."/);
  assert.match(settingsSource, /style=\{styles\.agentDeleteButton\}/);
  assert.match(settingsSource, /confirmDestructiveAction\('Delete Memory', `Are you sure you want to delete "\$\{memory\.title\}"\?`, async \(\) => \{/);
});