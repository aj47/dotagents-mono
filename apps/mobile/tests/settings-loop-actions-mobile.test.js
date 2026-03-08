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
  assert.match(settingsSource, /renderActionRailSwitchVisual\(loop\.enabled\)/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"[\s\S]*?createButtonAccessibilityLabel\(`Run \$\{loop\.name\} loop now`\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Run \$\{loop\.name\} loop now`\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{loop\.name\} loop`\)/);
});

test('adds an explicit edit affordance to each loop row', () => {
  assert.match(settingsSource, /onPress=\{\(\) => handleLoopEdit\(loop\)\}[\s\S]*?accessibilityRole="button"/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Edit \$\{loop\.name\} loop`\)/);
  assert.match(settingsSource, /const loopStatusHint = loop\.isRunning[\s\S]*?This loop is running right now\.[\s\S]*?This loop is enabled and waiting for its next run\.[\s\S]*?This loop is paused until you enable it again\./);
  assert.match(settingsSource, /accessibilityHint=\{`Opens this loop so you can review and change its schedule or prompt\. \$\{loopStatusHint\}`\}/);
  assert.match(settingsSource, /renderInlineEditAffordance\(\)/);
});

test('distinguishes running, active, and paused loops in row status styling', () => {
  assert.match(settingsSource, /loop\.isRunning[\s\S]*?\? styles\.statusConnected[\s\S]*?: loop\.enabled[\s\S]*?\? styles\.statusActive[\s\S]*?: styles\.statusDisconnected/);
  assert.match(settingsSource, /statusActive:\s*\{[\s\S]*?backgroundColor: theme\.colors\.primary,/);
});