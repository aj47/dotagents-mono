const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses shared repeat task list helpers for mobile settings state updates', () => {
  assert.match(settingsSource, /removeRepeatTaskFromList\(prev, loop\.id\)/);
  assert.match(settingsSource, /setRepeatTaskEnabledInList\(prev, loopId, res\.enabled\)/);
  assert.match(settingsSource, /applyRepeatTaskRuntimeStatusInList\(prev, loop\.id, result\.status\)/);
  assert.doesNotMatch(settingsSource, /prev\.filter\(item => item\.id !== loop\.id\)/);
  assert.doesNotMatch(settingsSource, /prev\.map\(l => \(l\.id === loopId \? \{ \.\.\.l, enabled: res\.enabled \} : l\)\)/);
  assert.doesNotMatch(settingsSource, /prev\.map\(item => \(item\.id === loop\.id \? applyRepeatTaskRuntimeStatus\(item, result\.status\) : item\)\)/);
});
