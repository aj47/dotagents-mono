const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ConnectionSettingsScreen.tsx'),
  'utf8'
);

test('requires both a DotAgents server URL and API key before saving', () => {
  assert.match(screenSource, /if \(!normalizedDraft\.baseUrl \|\| !normalizedDraft\.apiKey\) \{/);
  assert.match(screenSource, /Scan a DotAgents QR code or enter both a DotAgents server URL and API key before saving\./);
});

test('validates the DotAgents handshake through the settings API', () => {
  assert.match(screenSource, /checkDotAgentsServerConnection\(/);
});

test('exposes the API key visibility toggle as a button with a larger touch target', () => {
  assert.match(screenSource, /style=\{styles\.inlineActionButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(showApiKey \? 'Hide API key' : 'Show API key'\)/);
  assert.match(screenSource, /inlineActionButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\([\s\S]*?minSize:\s*44,/);
});

test('removes the generic base URL reset affordance', () => {
  assert.doesNotMatch(screenSource, /Reset base URL to default/);
  assert.doesNotMatch(screenSource, /Restores the default OpenAI-compatible base URL/);
});

test('surfaces a clear error when QR scanning cannot get camera permission', () => {
  assert.match(screenSource, /\{connectionError && \(/);
  assert.match(screenSource, /<Text style=\{styles\.errorText\}>\{connectionError\}<\/Text>/);
  assert.match(screenSource, /accessibilityLabel="Scan QR Code"/);
});

test('uses DotAgents-specific copy for manual connection fallback', () => {
  assert.match(screenSource, />DotAgents Server URL</);
  assert.match(screenSource, /placeholder='https:\/\/your-server\.example\.com\/v1'/);
  assert.match(screenSource, /Enter the API key for your DotAgents server/);
  assert.match(screenSource, /Enter the base URL for your DotAgents server/);
});

test('supports opening the QR scanner immediately from navigation params', () => {
  assert.match(screenSource, /route\?\.params\?\.openScanner/);
  assert.match(screenSource, /void handleScanQR\(\)/);
  assert.match(screenSource, /navigation\.setParams\(\{ openScanner: undefined \}\)/);
});
