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

test('general settings exposes show-main-window shortcut status and incomplete custom setup guidance', () => {
  assert.match(settingsSource, /const settingsHotkeyEnabled = configQuery\.data\?\.settingsHotkeyEnabled \?\? true/);
  assert.match(settingsSource, /const settingsHotkey = configQuery\.data\?\.settingsHotkey \|\| "ctrl-shift-s"/);
  assert.match(settingsSource, /const hasCustomSettingsHotkey = Boolean\(configQuery\.data\?\.customSettingsHotkey\?\.trim\(\)\)/);
  assert.match(settingsSource, /Keyboard shortcut is off\. Turn it on to show or focus the main window from anywhere\./);
  assert.match(settingsSource, /This shortcut also pauses while recording so it doesn't interrupt capture\./);
  assert.match(settingsSource, /The main window shortcut stays off until one is saved\./);
  assert.match(settingsSource, /Click to record custom main window shortcut/);
});

test('shared show-main-window display helper covers built-in and custom shortcuts', () => {
  assert.match(keyUtilsSource, /export function getSettingsHotkeyDisplay/);
  assert.match(keyUtilsSource, /case "ctrl-comma":\s*return "Ctrl\+,"/);
  assert.match(keyUtilsSource, /case "ctrl-shift-comma":\s*return "Ctrl\+Shift\+,"/);
  assert.match(keyUtilsSource, /return formatKeyComboForDisplay\(customShortcut\)/);
  assert.match(keyUtilsSource, /return "Set custom shortcut"/);
});

test('main keyboard handler still pauses the show-main-window shortcut while recording', () => {
  assert.match(keyboardSource, /Handle main window hotkey \(opens\/focuses UI without navigating\)/);
  assert.match(keyboardSource, /prevent during recording to avoid interruption/);
  assert.match(keyboardSource, /if \(config\.settingsHotkeyEnabled && !state\.isRecording\)/);
  assert.match(keyboardSource, /config\.settingsHotkey === "custom"[\s\S]*effectiveSettingsHotkey/);
});