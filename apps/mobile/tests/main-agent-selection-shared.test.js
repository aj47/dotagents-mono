const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);
const profileStoreSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'store', 'profile.ts'),
  'utf8'
);

test('mobile main-agent selection uses shared helpers directly', () => {
  assert.match(settingsSource, /@dotagents\/shared\/main-agent-selection/);
  assert.match(profileStoreSource, /@dotagents\/shared\/main-agent-selection/);
  assert.doesNotMatch(settingsSource, /\.\.\/lib\/mainAgentOptions/);
  assert.doesNotMatch(profileStoreSource, /\.\.\/lib\/mainAgentOptions/);
});
