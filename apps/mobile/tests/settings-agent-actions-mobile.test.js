const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('wraps each agent toggle in a named minimum touch target', () => {
  assert.match(settingsSource, /style=\{styles\.agentSwitchButton\}/);
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\(`\$\{profile\.displayName\} agent`\)/);
  assert.match(settingsSource, /accessibilityHint="Enables or disables this agent for delegation\."/);
  assert.match(settingsSource, /agentSwitchButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
  assert.match(settingsSource, /renderActionRailSwitchVisual\(profile\.enabled\)/);
  assert.match(settingsSource, /Platform\.OS === 'web'[\s\S]*?styles\.actionRailSwitchTrack/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?renderActionRailSwitchVisual\(profile\.enabled\)/);
  assert.match(settingsSource, /styles\.actionRailSwitchTrack[\s\S]*?accessible=\{false\}/);
});

test('gives agent delete actions explicit button semantics and a mobile-sized target', () => {
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{profile\.displayName\} agent`\)/);
  assert.match(settingsSource, /accessibilityHint="Removes this agent after confirmation\."/);
  assert.match(settingsSource, /agentDeleteButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
});