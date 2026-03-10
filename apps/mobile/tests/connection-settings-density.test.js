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
  assert.match(screenSource, /<Text style=\{styles\.scanButtonText\}>\{Platform\.OS === 'web' \? 'Scan QR Code or Paste Link' : 'Scan QR Code'\}<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.closeButtonText\}>Close<\/Text>/);
});

test('keeps QR actions explicitly labeled after removing decorative glyphs', () => {
  assert.match(screenSource, /accessibilityLabel="Scan QR Code"/);
  assert.match(screenSource, /accessibilityLabel="Close QR scanner"/);
  assert.match(screenSource, /On web, you can also paste the copied desktop deep link if camera scanning is unavailable/);
});

test('uses a web-safe deep-link fallback instead of mounting the camera scanner on Expo Web', () => {
  assert.match(screenSource, /\{Platform\.OS === 'web' \? \(/);
  assert.match(screenSource, /Paste the desktop deep link/);
  assert.match(screenSource, /accessibilityLabel=\{createTextInputAccessibilityLabel\('Desktop connection deep link'\)\}/);
  assert.match(screenSource, /accessibilityLabel="Apply desktop deep link"/);
  assert.match(screenSource, /dotagents:\/\/config\?baseUrl=\.\.\.&apiKey=\.\.\./);
  assert.match(screenSource, /Copy Deep Link, then paste it here to fill your Base URL and API key/);
});

test('disables the web deep-link apply action until the user pastes a link', () => {
  assert.match(screenSource, /const hasManualConfigLink = manualConfigLink\.trim\(\)\.length > 0;/);
  assert.match(screenSource, /style=\{\[styles\.primaryButton, !hasManualConfigLink && styles\.primaryButtonDisabled\]\}/);
  assert.match(screenSource, /disabled=\{!hasManualConfigLink\}/);
  assert.match(screenSource, /accessibilityState=\{\{ disabled: !hasManualConfigLink \}\}/);
});