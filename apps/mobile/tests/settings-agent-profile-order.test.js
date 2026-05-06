const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses shared default-first agent profile ordering in mobile settings', () => {
  assert.match(settingsSource, /sortAgentProfilesWithDefaultFirst/);
  assert.match(settingsSource, /const sortedAgentProfiles = useMemo\(/);
  assert.match(settingsSource, /sortAgentProfilesWithDefaultFirst\(agentProfiles\)/);
  assert.match(settingsSource, /sortedAgentProfiles\.length === 0/);
  assert.match(settingsSource, /sortedAgentProfiles\.map\(\(profile\) =>/);
  assert.doesNotMatch(settingsSource, /agentProfiles\.map\(\(profile\) =>/);
});
