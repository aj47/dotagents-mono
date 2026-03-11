const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'MemoryEditScreen.tsx'),
  'utf8'
);

test('memory edit turns the disconnected primary action into setup guidance', () => {
  assert.match(screenSource, /const openConnectionSettings = useCallback\(\(\) => \{[\s\S]*?navigation\.navigate\('ConnectionSettings'\);[\s\S]*?\}, \[navigation\]\);/);
  assert.match(screenSource, /const isConnectionConfigured = Boolean\(settingsClient\);/);
  assert.match(screenSource, /const primaryActionLabel = !isConnectionConfigured[\s\S]*?'Open Connection Settings'/);
  assert.match(screenSource, /onPress=\{isConnectionConfigured \? handleSave : openConnectionSettings\}/);
  assert.match(screenSource, /Connection settings are required before you can create or edit memories\./);
});

test('memory edit disables disconnected form fields instead of letting users draft unsavable changes', () => {
  assert.match(screenSource, /const isFormDisabled = isSaving \|\| !isConnectionConfigured;/);
  assert.match(screenSource, /editable=\{!isFormDisabled\}/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: isSelected, disabled: isFormDisabled \}\}/);
  assert.match(screenSource, /disabled=\{isFormDisabled\}/);
  assert.match(screenSource, /styles\.inputDisabled/);
});