const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses tunnel connection state for the settings connection card status', () => {
  assert.match(settingsSource, /useTunnelConnection\(\)/);
  assert.match(settingsSource, /const connectionCardState = !hasSavedConnectionConfig/);
  assert.match(settingsSource, /getConnectionStatusText\(connectionCardState, connectionInfo\.retryCount\)/);
  assert.match(settingsSource, /<ConnectionStatusIndicator[\s\S]*state=\{connectionCardState\}[\s\S]*retryCount=\{connectionInfo\.retryCount\}[\s\S]*compact/);
  assert.match(settingsSource, /const connectionCardUrl = connectionInfo\.baseUrl \?\? config\.baseUrl/);
});