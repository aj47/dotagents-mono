const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('clears stale remote settings slices when the mobile settings client disconnects or a partial fetch fails', () => {
  assert.match(settingsSource, /function buildRemoteSettingsInputDrafts\(settings: Settings \| null\): Record<string, string> \{/);
  assert.match(settingsSource, /if \(!settingsClient\) \{[\s\S]*?setProfiles\(\[\]\);[\s\S]*?setCurrentProfileId\(undefined\);[\s\S]*?setMcpServers\(\[\]\);[\s\S]*?setRemoteSettings\(null\);[\s\S]*?setRemoteError\(null\);[\s\S]*?setInputDrafts\(buildRemoteSettingsInputDrafts\(null\)\);/);
  assert.match(settingsSource, /if \(profilesRes\) \{[\s\S]*?successCount\+\+;[\s\S]*?\} else \{[\s\S]*?setProfiles\(\[\]\);[\s\S]*?setCurrentProfileId\(undefined\);[\s\S]*?\}/);
  assert.match(settingsSource, /if \(serversRes\) \{[\s\S]*?successCount\+\+;[\s\S]*?\} else \{[\s\S]*?setMcpServers\(\[\]\);[\s\S]*?\}/);
  assert.match(settingsSource, /if \(settingsRes\) \{[\s\S]*?setRemoteSettings\(settingsRes\);[\s\S]*?setInputDrafts\(buildRemoteSettingsInputDrafts\(settingsRes\)\);[\s\S]*?successCount\+\+;[\s\S]*?\} else \{[\s\S]*?setRemoteSettings\(null\);[\s\S]*?setInputDrafts\(buildRemoteSettingsInputDrafts\(null\)\);[\s\S]*?\}/);
});