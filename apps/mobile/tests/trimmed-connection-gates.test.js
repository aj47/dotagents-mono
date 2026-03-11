const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const settingsScreenSource = readRepoFile('src/screens/SettingsScreen.tsx');
const agentEditSource = readRepoFile('src/screens/AgentEditScreen.tsx');
const memoryEditSource = readRepoFile('src/screens/MemoryEditScreen.tsx');
const loopEditSource = readRepoFile('src/screens/LoopEditScreen.tsx');
const agentSelectorSource = readRepoFile('src/ui/AgentSelectorSheet.tsx');

test('settings screen uses trimmed connection state for visible connected actions', () => {
  assert.match(settingsScreenSource, /const hasApiConfig = hasConfiguredConnection\(config\);/);
  assert.match(settingsScreenSource, /if \(hasApiConfig\) \{[\s\S]*?new ExtendedSettingsApiClient\(config\.baseUrl, config\.apiKey\)/);
  assert.match(settingsScreenSource, /\{hasApiConfig \? 'Connected' : 'Not connected'\}/);
  assert.match(settingsScreenSource, /disabled=\{!hasApiConfig\}/);
});

test('edit and selector screens reuse trimmed connection gating before building API clients', () => {
  for (const source of [agentEditSource, memoryEditSource, loopEditSource]) {
    assert.match(source, /if \(hasConfiguredConnection\(config\)\) \{[\s\S]*?new ExtendedSettingsApiClient\(config\.baseUrl, config\.apiKey\)/);
  }

  assert.match(agentSelectorSource, /const hasApiConfig = hasConfiguredConnection\(config\);/);
});