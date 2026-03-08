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

test('keeps the connected server summary readable under narrow mobile widths', () => {
  assert.match(screenSource, /<Text style=\{styles\.statusUrl\} numberOfLines=\{2\}>[\s\S]*?\{config\.baseUrl\}[\s\S]*?<\/Text>/);
  assert.match(screenSource, /statusRow:\s*\{[\s\S]*?flexWrap:\s*'wrap'/);
  assert.match(screenSource, /statusText:\s*\{[\s\S]*?flexShrink:\s*1/);
});

test('lets connection label rows wrap before crowding inline actions', () => {
  assert.match(screenSource, /<Text style=\{styles\.labelRowTitle\}>API Key<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.labelRowTitle\}>Base URL<\/Text>/);
  assert.match(screenSource, /labelRow:\s*\{[\s\S]*?alignItems:\s*'flex-start'[\s\S]*?flexWrap:\s*'wrap'/);
  assert.match(screenSource, /labelRowTitle:\s*\{[\s\S]*?minWidth:\s*0,[\s\S]*?flexShrink:\s*1,/);
  assert.match(screenSource, /inlineActionButton:\s*\{[\s\S]*?marginLeft:\s*'auto',[\s\S]*?flexShrink:\s*0,/);
});
