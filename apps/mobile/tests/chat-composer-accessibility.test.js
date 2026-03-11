const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('exposes the chat composer send control as an accessible button', () => {
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?accessibilityLabel=\{createButtonAccessibilityLabel\('Send message'\)\}/);
  assert.match(screenSource, /accessibilityHint=\{composerSendState\.sendAccessibilityHint\}/);
  assert.match(screenSource, /accessibilityState=\{\{ disabled: !composerSendState\.canSend \}\}/);
});

test('keeps the chat composer send control at a mobile-friendly minimum touch target', () => {
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*64,/);
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?alignItems:\s*'center',[\s\S]*?justifyContent:\s*'center',/);
});

test('keeps the chat composer accessory controls at a mobile-friendly touch target size', () => {
  assert.match(screenSource, /ttsToggle:\s*\{[\s\S]*?width:\s*44,[\s\S]*?height:\s*44,[\s\S]*?borderRadius:\s*22,/);
});

test('shows an inline disconnected composer notice instead of letting first-run sends fail opaquely', () => {
  assert.match(screenSource, /\{composerSendState\.helperText && \([\s\S]*?styles\.composerConnectionNotice[\s\S]*?composerSendState\.helperText/);
  assert.match(screenSource, /composerConnectionNotice:\s*\{[\s\S]*?borderColor:\s*hexToRgba\(theme\.colors\.info, 0\.25\),[\s\S]*?backgroundColor:\s*hexToRgba\(theme\.colors\.info, 0\.08\),/);
});

test('exposes the edit-before-send toggle state to Expo Web accessibility APIs', () => {
  assert.match(screenSource, /accessibilityRole="switch"[\s\S]*?aria-checked=\{willCancel\}[\s\S]*?accessibilityState=\{\{ checked: willCancel \}\}/);
});