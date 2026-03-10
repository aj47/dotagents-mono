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
  assert.match(screenSource, /Enter an API key, scan a DotAgents QR code, or paste a DotAgents link before saving/);
});

test('keeps the custom URL validation after the no-key guard', () => {
  assert.match(
    screenSource,
    /if \(!isConnected && !hasApiKey\) \{[\s\S]*?return;[\s\S]*?if \(hasCustomUrl && !hasApiKey\) \{/
  );
});

test('exposes the API key visibility toggle as a button with a larger touch target', () => {
  assert.match(screenSource, /style=\{styles\.inlineActionButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(showApiKey \? 'Hide API key' : 'Show API key'\)/);
  assert.match(screenSource, /inlineActionButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\([\s\S]*?minSize:\s*44,/);
});

test('exposes the reset action as an accessible button with a descriptive label', () => {
  assert.match(screenSource, /createButtonAccessibilityLabel\('Reset base URL to default'\)/);
  assert.match(screenSource, /Restores the default OpenAI-compatible base URL/);
});

test('surfaces a clear error when QR scanning cannot get camera permission', () => {
  assert.match(screenSource, /\{connectionError && \(/);
  assert.match(screenSource, /<Text style=\{styles\.errorText\}>\{connectionError\}<\/Text>/);
  assert.match(screenSource, /accessibilityLabel="Scan QR Code"/);
});

test('offers a paste-link fallback for desktop deep links when QR scanning is unavailable', () => {
  assert.match(screenSource, /Paste DotAgents link/);
  assert.match(screenSource, /Copy Deep Link/);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Paste DotAgents link'\)\}/);
  assert.match(screenSource, /Paste a valid DotAgents link from the desktop app QR section\./);
  assert.match(screenSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Use pasted DotAgents link'\)\}/);
});
