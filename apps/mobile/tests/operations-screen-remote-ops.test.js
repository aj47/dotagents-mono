const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const operationsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'OperationsScreen.tsx'),
  'utf8'
);

test('exposes compact remote access settings for mobile remote ops', () => {
  assert.match(operationsSource, /Remote access settings/);
  assert.match(operationsSource, /Remote Server/);
  assert.match(operationsSource, /Bind Address/);
  assert.match(operationsSource, /Auto-Show Panel/);
  assert.match(operationsSource, /Terminal QR/);
  assert.match(operationsSource, /Trusted operator devices/);
  assert.match(operationsSource, /Current device ID:/);
  assert.match(operationsSource, /Trust this device/);
  assert.match(operationsSource, /Tunnel Mode/);
  assert.match(operationsSource, /Auto-Start Tunnel/);
  assert.match(operationsSource, /Credentials Path/);
  assert.match(operationsSource, /Channel operator allowlists/);
  assert.match(operationsSource, /Discord Operator User IDs/);
  assert.match(operationsSource, /Discord Operator Guild IDs/);
  assert.match(operationsSource, /Discord Operator Channel IDs/);
  assert.match(operationsSource, /WhatsApp Operator Allowlist/);
  assert.match(operationsSource, /getDeviceIdentity/);
});

test('includes tunnel, Discord, and WhatsApp operator controls and summaries', () => {
  assert.match(operationsSource, /Tunnel status/);
  assert.match(operationsSource, /Tunnel Setup/);
  assert.match(operationsSource, /Start tunnel/);
  assert.match(operationsSource, /Stop tunnel/);
  assert.match(operationsSource, /Discord log preview/);
  assert.match(operationsSource, /Connect Discord/);
  assert.match(operationsSource, /Clear logs/);
  assert.match(operationsSource, /Connect WhatsApp/);
  assert.match(operationsSource, /Log out/);
});

test('surfaces recent operator audit entries and rotates the API key using the saved mobile config', () => {
  assert.match(operationsSource, /Recent operator audit/);
  assert.match(operationsSource, /Rotate API key/);
  assert.match(operationsSource, /Check latest release/);
  assert.match(operationsSource, /Download latest installer/);
  assert.match(operationsSource, /Reveal downloaded installer/);
  assert.match(operationsSource, /Open downloaded installer/);
  assert.match(operationsSource, /Open release page/);
  assert.match(operationsSource, /Latest release:/);
  assert.match(operationsSource, /Recommended asset:/);
  assert.match(operationsSource, /settingsClient\.rotateOperatorApiKey\(\)/);
  assert.match(operationsSource, /settingsClient\.checkOperatorUpdater\(\)/);
  assert.match(operationsSource, /settingsClient\.downloadOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.revealOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.openOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.openOperatorReleasesPage\(\)/);
  assert.match(operationsSource, /setConfig\(nextConfig\)/);
  assert.match(operationsSource, /saveConfig\(nextConfig\)/);
});

test('displays system metrics and agent sessions from operator status', () => {
  assert.match(operationsSource, /status\.system\.hostname/);
  assert.match(operationsSource, /status\.system\.platform/);
  assert.match(operationsSource, /status\.system\.memoryUsage\.rssMB/);
  assert.match(operationsSource, /status\.system\.processUptimeSeconds/);
  assert.match(operationsSource, /formatDuration/);
  assert.match(operationsSource, /Agent sessions/);
  assert.match(operationsSource, /status\.sessions\.activeSessions/);
  assert.match(operationsSource, /status\.sessions\.activeSessionDetails/);
  assert.match(operationsSource, /No active agent sessions/);
});

test('auto-refreshes operator data periodically', () => {
  assert.match(operationsSource, /AUTO_REFRESH_INTERVAL_MS/);
  assert.match(operationsSource, /setInterval/);
  assert.match(operationsSource, /clearInterval/);
  assert.match(operationsSource, /autoRefreshRef/);
});

test('displays recent conversations from operator API', () => {
  assert.match(operationsSource, /getOperatorConversations/);
  assert.match(operationsSource, /setConversations/);
  assert.match(operationsSource, /Recent conversations/);
  assert.match(operationsSource, /conversations\.map/);
});

test('displays MCP servers from operator API', () => {
  assert.match(operationsSource, /getOperatorMCP/);
  assert.match(operationsSource, /setMcpServers/);
  assert.match(operationsSource, /MCP servers/);
  assert.match(operationsSource, /mcpServers\.map/);
});