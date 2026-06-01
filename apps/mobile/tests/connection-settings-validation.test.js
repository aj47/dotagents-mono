const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ConnectionSettingsScreen.tsx'),
  'utf8'
);

test('blocks first-time save when no API key is provided', () => {
  assert.match(screenSource, /if \(!isConnected && !hasApiKey\) \{/);
  assert.match(
    screenSource,
    /Scan a DotAgents QR code or enter a base URL and API key before saving/
  );
});

test('no longer silently defaults a missing base URL to OpenAI on save', () => {
  // Issue #490: the mobile companion should not invent an OpenAI base URL on
  // the user's behalf — pairing with the DotAgents desktop is the primary path.
  assert.doesNotMatch(screenSource, /DEFAULT_OPENAI_BASE_URL/);
  assert.doesNotMatch(screenSource, /api\.openai\.com\/v1/);
});

test('requires a base URL whenever an API key is provided', () => {
  assert.match(
    screenSource,
    /if \(!isConnected && !hasApiKey\) \{[\s\S]*?return;[\s\S]*?if \(hasApiKey && !normalizedDraft\.baseUrl\) \{/
  );
  assert.match(
    screenSource,
    /Scan a DotAgents QR code or enter a base URL before saving/
  );
});

test('exposes the API key visibility toggle as a button with a larger touch target', () => {
  assert.match(screenSource, /style=\{styles\.inlineActionButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(showApiKey \? 'Hide API key' : 'Show API key'\)/);
  assert.match(screenSource, /inlineActionButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\([\s\S]*?minSize:\s*44,/);
});

test('exposes the reset action as an accessible button with a descriptive label', () => {
  assert.match(screenSource, /createButtonAccessibilityLabel\('Clear base URL'\)/);
  assert.match(screenSource, /Clears the base URL so you can re-pair via QR code/);
});

test('surfaces a clear error when QR scanning cannot get camera permission', () => {
  assert.match(screenSource, /\{connectionError && \(/);
  assert.match(screenSource, /<Text style=\{styles\.errorText\}>\{connectionError\}<\/Text>/);
  assert.match(screenSource, /accessibilityLabel="Scan QR Code"/);
});

test('supports opening the QR scanner immediately from navigation params', () => {
  assert.match(screenSource, /route\?\.params\?\.openScanner/);
  assert.match(screenSource, /void handleScanQR\(\)/);
  assert.match(screenSource, /navigation\.setParams\(\{ openScanner: undefined \}\)/);
});
