const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('keeps the mobile handsfree MVP guidance visible in settings', () => {
  assert.match(settingsSource, /Hands-free Voice Mode/);
  assert.match(settingsSource, /Mobile v1 only works while the app stays open on the Chat screen in the foreground\./);
});

test('exposes wake and sleep phrase fields for handsfree tuning', () => {
  assert.match(settingsSource, />Wake phrase<\/Text>/);
  assert.match(settingsSource, /placeholder='hey dot agents'/);
  assert.match(settingsSource, />Sleep phrase<\/Text>/);
  assert.match(settingsSource, /placeholder='go to sleep'/);
  assert.match(settingsSource, />Send after silence<\/Text>/);
  assert.match(settingsSource, /Wait this many milliseconds without new speech before sending a hands-free message\./);
});

test('keeps internal voice diagnostics behind explicit settings toggles', () => {
  assert.match(settingsSource, /Debug Voice State/);
  assert.match(settingsSource, /Foreground Only/);
});