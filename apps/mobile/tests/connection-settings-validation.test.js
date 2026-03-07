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
  assert.match(screenSource, /Enter an API key or scan a DotAgents QR code before saving/);
});

test('keeps the custom URL validation after the no-key guard', () => {
  assert.match(
    screenSource,
    /if \(!isConnected && !hasApiKey\) \{[\s\S]*?return;[\s\S]*?if \(hasCustomUrl && !hasApiKey\) \{/
  );
});