const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-general.tsx'), 'utf8');
const onboardingSource = fs.readFileSync(path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'onboarding.tsx'), 'utf8');
const sessionsSource = fs.readFileSync(path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'sessions.tsx'), 'utf8');
const keyUtilsSource = fs.readFileSync(path.join(__dirname, '..', 'apps', 'desktop', 'src', 'shared', 'key-utils.ts'), 'utf8');
const keyboardSource = fs.readFileSync(path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'keyboard.ts'), 'utf8');

test('general settings exposes recording shortcut status, end-description, and incomplete custom setup guidance', () => {
  assert.match(settingsSource, /const customRecordingShortcutMode = configQuery\.data\?\.customShortcutMode \|\| "hold"/);
  assert.match(settingsSource, /const hasCustomRecordingShortcut = Boolean\(configQuery\.data\?\.customShortcut\?\.trim\(\)\)/);
  assert.match(settingsSource, /Finish recording a custom shortcut to enable voice dictation/);
  assert.match(settingsSource, /keyboard voice dictation won't start\. Changes save immediately\./);
  assert.match(settingsSource, /Voice dictation won't start from the keyboard until one is saved\./);
  assert.match(settingsSource, /Click to record custom voice dictation shortcut/);
});

test('shared dictation shortcut display reflects hold vs toggle custom modes and incomplete setup', () => {
  assert.match(keyUtilsSource, /export function getDictationShortcutDisplay/);
  assert.match(keyUtilsSource, /customMode: "hold" \| "toggle" = "hold"/);
  assert.match(keyUtilsSource, /case "ctrl-slash":\s*return "Press Ctrl\+\/"/);
  assert.match(keyUtilsSource, /return customMode === "toggle"\s*\? `Press \$\{formattedShortcut\}`\s*:\s*`Hold \$\{formattedShortcut\}`/);
  assert.match(keyUtilsSource, /return "Set custom shortcut"/);
});

test('onboarding and sessions reuse the recording shortcut display semantics', () => {
  assert.match(onboardingSource, /const recordingShortcutDisplay = getDictationShortcutDisplay\(/);
  assert.match(onboardingSource, /const recordingShortcutSummary =/);
  assert.match(onboardingSource, /the keyboard shortcut won't start voice dictation\./);
  assert.match(onboardingSource, /Voice dictation won't start from the keyboard until one is saved\./);
  assert.match(onboardingSource, /<p className="text-primary font-semibold">\{recordingShortcutDisplay\}<\/p>/);
  assert.match(sessionsSource, /getDictationShortcutDisplay\([\s\S]*configQuery\.data\?\.customShortcutMode/);
});

test('main keyboard handler still supports built-in hold, built-in toggle, and custom recording shortcut flows', () => {
  assert.match(keyboardSource, /if \(config\.shortcut === "ctrl-slash"\)/);
  assert.match(keyboardSource, /Recording triggered: Ctrl\+\//);
  assert.match(keyboardSource, /Recording triggered: Custom hotkey \(toggle mode\)/);
  assert.match(keyboardSource, /Recording triggered: Custom hotkey \(hold mode\)/);
  assert.match(keyboardSource, /Handle hold-ctrl mode \(default behavior\)/);
});