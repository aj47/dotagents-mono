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

test('exposes the API key visibility toggle as a button with a larger touch target', () => {
  assert.match(screenSource, /style=\{styles\.inlineActionButton\}[\s\S]*?accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(showApiKey \? 'Hide API key' : 'Show API key'\)/);
  assert.match(screenSource, /inlineActionButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\([\s\S]*?minSize:\s*44,/);
});

test('exposes the reset action as an accessible button with a descriptive label', () => {
  assert.match(screenSource, /createButtonAccessibilityLabel\('Reset base URL to default'\)/);
  assert.match(screenSource, /Restores the default OpenAI-compatible base URL/);
});

test('uses a web-specific DotAgents link fallback instead of the dead QR scanner flow', () => {
  assert.match(screenSource, /const isWebPlatform = Platform\.OS === 'web';/);
  assert.match(screenSource, /if \(isWebPlatform\) \{[\s\S]*?setShowWebLinkModal\(true\);[\s\S]*?return;/);
  assert.match(screenSource, /isWebPlatform \? '🔗 Paste DotAgents Link' : '📷 Scan QR Code'/);
  assert.match(screenSource, /Expo Web cannot reliably open the camera scanner here yet\./);
});

test('lets web users paste the desktop deep link and reuse the existing QR parser', () => {
  assert.match(screenSource, /parseQRCode\(webLinkValue\.trim\(\)\)/);
  assert.match(screenSource, /Paste the full dotagents:\/\/config link copied from the desktop app/);
  assert.match(screenSource, /Copy the Deep Link from the desktop app and paste the full [^\n]+ value here to fill in the server URL and API key\./);
});
