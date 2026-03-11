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
  assert.match(screenSource, /<Text style=\{styles\.closeButtonText\}>Close scanner<\/Text>/);
});

test('keeps QR actions explicitly labeled after removing decorative glyphs', () => {
  assert.match(screenSource, /accessibilityLabel="Scan QR Code"/);
  assert.match(screenSource, /accessibilityLabel="Close QR scanner"/);
  assert.match(screenSource, /Scan the QR code from your DotAgents desktop app to connect/);
});

test('keeps the QR scanner close control at a minimum touch target and pinned to the safe area', () => {
  assert.match(screenSource, /style=\{\[styles\.closeButton, \{ top: Math\.max\(insets\.top \+ spacing\.sm, spacing\.lg\) \}\]\}/);
  assert.match(screenSource, /closeButton: \{[\s\S]*createMinimumTouchTargetStyle\(\{[\s\S]*minSize: 44,[\s\S]*horizontalMargin: 0,[\s\S]*\}\),/);
  assert.match(screenSource, /borderColor: 'rgba\(255,255,255,0\.24\)'/);
});