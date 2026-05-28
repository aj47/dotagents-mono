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
    /Scan the DotAgents QR code or enter your server URL and API key before saving/
  );
});

test('requires both server URL and API key together', () => {
  // The previous "custom URL" branch existed because the screen silently filled
  // in https://api.openai.com/v1 when the URL was blank, making the default
  // appear configured. Now the URL must be supplied explicitly, so the
  // validation is symmetric — neither field can be set without the other.
  assert.match(
    screenSource,
    /if \(hasApiKey && !hasBaseUrl\) \{[\s\S]*?Base URL is required when an API key is provided/
  );
  assert.match(
    screenSource,
    /if \(hasBaseUrl && !hasApiKey\) \{[\s\S]*?API key is required when a server URL is provided/
  );
});

test('does not silently default the base URL to api.openai.com', () => {
  // Mobile is a companion to the DotAgents desktop remote server. A fresh
  // install used to fall back to https://api.openai.com/v1 with an empty API
  // key, which made the app look configured while being unreachable.
  assert.doesNotMatch(screenSource, /https:\/\/api\.openai\.com\/v1[^']*['"]\s*\)\s*;?\s*$/m);
  assert.doesNotMatch(screenSource, /DEFAULT_OPENAI_BASE_URL\s*=/);
});

test('exposes the API key visibility toggle as a button with a larger touch target', () => {
  assert.match(screenSource, /style=\{styles\.inlineActionButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(showApiKey \? 'Hide API key' : 'Show API key'\)/);
  assert.match(screenSource, /inlineActionButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\([\s\S]*?minSize:\s*44,/);
});

test('exposes the clear action as an accessible button with a descriptive label', () => {
  assert.match(screenSource, /createButtonAccessibilityLabel\('Clear base URL'\)/);
  assert.match(
    screenSource,
    /Clears the server URL so you can scan a fresh DotAgents QR code or paste a new one/
  );
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
