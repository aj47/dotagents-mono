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

test('general settings exposes toggle voice dictation shortcut status and incomplete custom setup guidance', () => {
  assert.match(settingsSource, /const toggleVoiceDictationEnabled =\s*configQuery\.data\?\.toggleVoiceDictationEnabled \?\? false/);
  assert.match(settingsSource, /const toggleVoiceDictationHotkey = configQuery\.data\?\.toggleVoiceDictationHotkey \|\| "fn"/);
  assert.match(settingsSource, /const hasCustomToggleVoiceDictationHotkey = Boolean\(/);
  assert.match(settingsSource, /Toggle voice dictation is off\. Turn it on if you want one shortcut press to start recording and another press to stop it\./);
  assert.match(settingsSource, /Press \$\{toggleVoiceDictationShortcutDisplay\} once to start voice dictation, then press it again to stop and submit\./);
  assert.match(settingsSource, /Toggle voice dictation won't start from the keyboard until one is saved\./);
  assert.match(settingsSource, /Click to record custom toggle voice dictation shortcut/);
});

test('shared toggle voice dictation display helper covers fn, function keys, and custom shortcuts', () => {
  assert.match(keyUtilsSource, /export function getToggleVoiceDictationShortcutDisplay/);
  assert.match(keyUtilsSource, /case "fn":\s*return "Fn"/);
  assert.match(keyUtilsSource, /case "f10":\s*return "F10"/);
  assert.match(keyUtilsSource, /return formatKeyComboForDisplay\(customShortcut\)/);
  assert.match(keyUtilsSource, /return "Set custom shortcut"/);
});

test('main keyboard handler still supports fn, function-key, and custom toggle voice dictation shortcuts', () => {
  assert.match(keyboardSource, /Handle toggle voice dictation shortcuts/);
  assert.match(keyboardSource, /if \(toggleHotkey === "fn"\)/);
  assert.match(keyboardSource, /Toggle voice dictation triggered: Fn/);
  assert.match(keyboardSource, /toggleHotkey && toggleHotkey !== "custom" && toggleHotkey\.startsWith\("f"\)/);
  assert.match(keyboardSource, /Toggle voice dictation triggered: Custom hotkey/);
});