const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-general.tsx'),
  'utf8'
);

const keyUtilsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'shared', 'key-utils.ts'),
  'utf8'
);

const keyboardSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'keyboard.ts'),
  'utf8'
);

test('general settings exposes text-input shortcut status, continue behavior, and incomplete custom setup guidance', () => {
  assert.match(settingsSource, /const textInputEnabled = configQuery\.data\?\.textInputEnabled \?\? true/);
  assert.match(settingsSource, /const hasCustomTextInputShortcut = Boolean\(configQuery\.data\?\.customTextInputShortcut\?\.trim\(\)\)/);
  assert.match(settingsSource, /Turn it on to open the panel directly in text input mode from anywhere\./);
  assert.match(settingsSource, /Add Shift to continue your most recent conversation instead\./);
  assert.match(settingsSource, /This shortcut opens a fresh text draft because Shift is already part of it\./);
  assert.match(settingsSource, /Custom text input shortcuts do not currently have a separate continue-last-conversation variant\./);
  assert.match(settingsSource, /Text input won't open from the keyboard until one is saved\./);
  assert.match(settingsSource, /Click to record custom text input shortcut/);
});

test('shared text-input display helper covers built-in and custom shortcuts', () => {
  assert.match(keyUtilsSource, /export function getTextInputShortcutDisplay/);
  assert.match(keyUtilsSource, /case "ctrl-shift-t":\s*return "Ctrl\+Shift\+T"/);
  assert.match(keyUtilsSource, /return formatKeyComboForDisplay\(customShortcut\)/);
  assert.match(keyUtilsSource, /return "Set custom shortcut"/);
});

test('main keyboard handler still documents which text-input shortcuts can continue the last conversation', () => {
  assert.match(keyboardSource, /Show text input that continues the most recent conversation\./);
  assert.match(keyboardSource, /Shift\+Ctrl\+T = continue last conversation/);
  assert.match(keyboardSource, /Shift\+Alt\+T = continue last conversation/);
  assert.match(keyboardSource, /config\.textInputShortcut === "custom"[\s\S]*effectiveTextInputShortcut/);
});