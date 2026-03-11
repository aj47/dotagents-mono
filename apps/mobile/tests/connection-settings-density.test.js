const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ConnectionSettingsScreen.tsx'),
  'utf8'
);
const qrHelperSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'connection-settings-qr.ts'),
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
  assert.match(qrHelperSource, /Allow camera access to scan/);
  assert.match(qrHelperSource, /Allow camera access/);
  assert.match(screenSource, /Scan the QR code from your DotAgents desktop app to connect/);
});

test('keeps the QR scanner close control at a minimum touch target and pinned to the safe area', () => {
  assert.match(screenSource, /style=\{\[styles\.closeButton, \{ top: Math\.max\(insets\.top \+ spacing\.sm, spacing\.lg\) \}\]\}/);
  assert.match(screenSource, /closeButton: \{[\s\S]*createMinimumTouchTargetStyle\(\{[\s\S]*minSize: 44,[\s\S]*horizontalMargin: 0,[\s\S]*\}\),/);
  assert.match(screenSource, /borderColor: 'rgba\(255,255,255,0\.24\)'/);
});

test('opens an explicit web scanner sheet before requesting browser camera permission', () => {
  assert.match(screenSource, /if \(Platform\.OS === 'web'\) \{[\s\S]*setShowScanner\(true\);[\s\S]*return;/);
  assert.match(screenSource, /<Text style=\{styles\.webScannerFallbackTitle\}>\{webScannerSheet\.title\}<\/Text>/);
  assert.match(screenSource, /Requests browser camera access so the QR scanner can open on mobile web\./);
  assert.match(qrHelperSource, /Try camera access again/);
});