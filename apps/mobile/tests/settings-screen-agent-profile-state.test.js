const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses shared agent profile list helpers for mobile settings state updates', () => {
  assert.match(settingsSource, /setAgentProfileEnabledInList\(prev, profileId, res\.enabled\)/);
  assert.match(settingsSource, /removeAgentProfileFromList\(prev, profile\.id\)/);
  assert.doesNotMatch(settingsSource, /prev\.map\(p => \(p\.id === profileId \? \{ \.\.\.p, enabled: res\.enabled \} : p\)\)/);
  assert.doesNotMatch(settingsSource, /prev\.filter\(p => p\.id !== profile\.id\)/);
});
