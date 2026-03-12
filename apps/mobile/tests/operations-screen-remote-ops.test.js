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
  assert.match(operationsSource, /Tunnel Mode/);
  assert.match(operationsSource, /Auto-Start Tunnel/);
  assert.match(operationsSource, /Credentials Path/);
  assert.match(operationsSource, /Channel operator allowlists/);
  assert.match(operationsSource, /Discord Operator User IDs/);
  assert.match(operationsSource, /Discord Operator Guild IDs/);
  assert.match(operationsSource, /Discord Operator Channel IDs/);
  assert.match(operationsSource, /WhatsApp Operator Allowlist/);
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
  assert.match(operationsSource, /Open release page/);
  assert.match(operationsSource, /Latest release:/);
  assert.match(operationsSource, /Recommended asset:/);
  assert.match(operationsSource, /settingsClient\.rotateOperatorApiKey\(\)/);
  assert.match(operationsSource, /settingsClient\.checkOperatorUpdater\(\)/);
  assert.match(operationsSource, /settingsClient\.downloadOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.revealOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.openOperatorReleasesPage\(\)/);
  assert.match(operationsSource, /setConfig\(nextConfig\)/);
  assert.match(operationsSource, /saveConfig\(nextConfig\)/);
});