const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses shared skill list helpers for mobile settings state updates', () => {
  assert.match(settingsSource, /setSkillEnabledForProfileInList\(prev, skillId, res\.enabledForProfile\)/);
  assert.match(settingsSource, /removeSkillFromList\(prev, skill\.id\)/);
  assert.match(settingsSource, /const deletedIds = getSuccessfulSkillDeleteIds\(result\.results\)/);
  assert.match(settingsSource, /removeSkillsFromList\(prev, deletedIds\)/);
  assert.doesNotMatch(settingsSource, /prev\.map\(s => \(s\.id === skillId \? \{ \.\.\.s, enabledForProfile: res\.enabledForProfile \} : s\)\)/);
  assert.doesNotMatch(settingsSource, /prev\.filter\(item => item\.id !== skill\.id\)/);
  assert.doesNotMatch(settingsSource, /result\.results\.filter\(item => item\.success\)\.map\(item => item\.id\)/);
});
