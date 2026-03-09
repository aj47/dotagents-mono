const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ConnectionSettingsScreen.tsx'),
  'utf8'
);

test('avoids decorative emoji chrome in the mobile connection settings screen', () => {
  assert.doesNotMatch(screenSource, /📷|⚠️|✕ Close/);
  assert.match(screenSource, /<Text style=\{styles\.scanButtonText\}>Scan QR Code<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.closeButtonText\}>Close<\/Text>/);
});

test('keeps QR actions explicitly labeled after removing decorative glyphs', () => {
  assert.match(screenSource, /accessibilityLabel="Scan QR Code"/);
  assert.match(screenSource, /accessibilityLabel="Close QR scanner"/);
  assert.match(screenSource, /Scan the QR code from your DotAgents desktop app to connect/);
});