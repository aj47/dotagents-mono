const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('exposes agent loop row actions as descriptive buttons', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(`Run \$\{loop\.name\} loop now`\)/);
  assert.match(screenSource, /Runs this loop immediately without waiting for the next scheduled interval\./);
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(`Delete \$\{loop\.name\} loop`\)/);
  assert.match(screenSource, /Opens a confirmation prompt before permanently deleting this loop\./);
});

test('keeps agent loop row actions wrap-friendly with mobile-sized touch targets', () => {
  assert.match(screenSource, /loopActions:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?flexWrap:\s*'wrap',[\s\S]*?gap:\s*spacing\.sm,/);
  assert.match(screenSource, /loopActionButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\),[\s\S]*?minWidth:\s*92,/);
  assert.match(screenSource, /loopActionButtonText:\s*\{[\s\S]*?textAlign:\s*'center',/);
});