const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const sharedPresetSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'agent-profile-presets.ts'),
  'utf8'
);

test('uses shared desktop agent presets on the mobile create screen', () => {
  assert.match(screenSource, /AGENT_PROFILE_PRESETS/);
  assert.match(screenSource, /detectAgentProfilePresetKey\(formData\)/);
  assert.match(screenSource, /getAgentProfilePresetFormFields/);
  assert.match(screenSource, /const applyAgentPreset = useCallback\(\(presetKey: AgentProfilePresetKey\)/);
  assert.match(screenSource, /Object\.entries\(AGENT_PROFILE_PRESETS\)\.map/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`Use \$\{preset\.displayName\} agent preset`\)/);
});

test('mobile preset selection uses shared editable preset fields', () => {
  assert.match(screenSource, /\.\.\.getAgentProfilePresetFormFields\(presetKey\)/);
  assert.doesNotMatch(screenSource, /displayName: preset\.displayName/);
  assert.doesNotMatch(screenSource, /description: preset\.description/);
  assert.doesNotMatch(screenSource, /connectionType: preset\.connectionType/);
  assert.doesNotMatch(screenSource, /connectionCommand: preset\.connectionCommand/);
  assert.doesNotMatch(screenSource, /connectionArgs: preset\.connectionArgs/);
});

test('shared presets keep the current external agent command catalog', () => {
  assert.match(sharedPresetSource, /auggie:[\s\S]*connectionCommand: 'auggie'[\s\S]*connectionArgs: '--acp'/);
  assert.match(sharedPresetSource, /'claude-code':[\s\S]*connectionCommand: 'claude-code-acp'/);
  assert.match(sharedPresetSource, /codex:[\s\S]*connectionCommand: 'codex-acp'/);
  assert.match(sharedPresetSource, /opencode:[\s\S]*connectionCommand: 'opencode'[\s\S]*connectionArgs: 'acp'/);
});
