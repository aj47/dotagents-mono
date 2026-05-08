const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses shared MCP server list helpers for mobile settings state updates', () => {
  assert.match(settingsSource, /setMcpServerRuntimeEnabledInList\(prev, serverName, enabled\)/);
  assert.match(settingsSource, /removeMcpServerFromList\(prev, server\.name\)/);
  assert.match(settingsSource, /existingServerNames: getMcpServerNamesInList\(mcpServers\)/);
  assert.doesNotMatch(settingsSource, /s\.name === serverName \? \{ \.\.\.s, enabled, runtimeEnabled: enabled \} : s/);
  assert.doesNotMatch(settingsSource, /prev\.filter\(item => item\.name !== server\.name\)/);
  assert.doesNotMatch(settingsSource, /existingServerNames: mcpServers\.map\(server => server\.name\)/);
});
