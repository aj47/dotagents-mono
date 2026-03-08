const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses minimum touch targets for loop action controls', () => {
  assert.match(settingsSource, /const compactActionTouchTarget = createMinimumTouchTargetStyle\(\{/);
  assert.match(settingsSource, /loopSwitchButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
  assert.match(settingsSource, /loopActionButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
});

test('adds explicit accessibility semantics for loop actions', () => {
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\(`\$\{loop\.name\} loop`\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Run \$\{loop\.name\} loop now`\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{loop\.name\} loop`\)/);
});