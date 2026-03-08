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

test('general settings exposes kill switch fallback and incomplete custom setup guidance', () => {
  assert.match(settingsSource, /const killSwitchHotkey = configQuery\.data\?\.agentKillSwitchHotkey \|\| "ctrl-shift-escape"/);
  assert.match(settingsSource, /const hasCustomAgentKillSwitchHotkey = Boolean\([\s\S]*customAgentKillSwitchHotkey\?\.trim\(\)/);
  assert.match(settingsSource, /Ctrl\+Shift\+Escape remains the active emergency stop/);
  assert.match(settingsSource, /Ctrl\+Shift\+Escape always works as a hard emergency stop too/);
  assert.match(settingsSource, /fallback hard emergency stop until then/);
});

test('shared kill switch display helper covers built-in and custom shortcuts', () => {
  assert.match(keyUtilsSource, /export function getAgentKillSwitchShortcutDisplay/);
  assert.match(keyUtilsSource, /case "ctrl-alt-q":\s*return "Ctrl\+Alt\+Q"/);
  assert.match(keyUtilsSource, /case "ctrl-shift-q":\s*return "Ctrl\+Shift\+Q"/);
  assert.match(keyUtilsSource, /return formatKeyComboForDisplay\(customShortcut\)/);
  assert.match(keyUtilsSource, /return "Set custom shortcut"/);
});

test('main keyboard handler still preserves Ctrl+Shift+Escape as the hard kill fallback', () => {
  assert.match(keyboardSource, /Always allow Ctrl\+Shift\+Escape as a hard emergency stop/);
  assert.match(keyboardSource, /"Ctrl\+Shift\+Escape \(fallback hard kill\)"/);
  assert.match(keyboardSource, /config\.agentKillSwitchHotkey === "custom"[\s\S]*effectiveKillSwitchHotkey/);
});