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
  assert.match(screenSource, /accessibilityHint=\{canComposeChat \? 'Sends your typed text and any attached images to the selected agent\.' : 'Open Connection settings before sending a chat message\.'\}/);
  assert.match(screenSource, /accessibilityState=\{\{ disabled: !canSubmitComposer \}\}/);
});

test('keeps the chat composer send control at a mobile-friendly minimum touch target', () => {
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*64,/);
  assert.match(screenSource, /sendButton:\s*\{[\s\S]*?alignItems:\s*'center',[\s\S]*?justifyContent:\s*'center',/);
});

test('keeps the chat composer accessory controls at a mobile-friendly touch target size', () => {
  assert.match(screenSource, /ttsToggle:\s*\{[\s\S]*?width:\s*44,[\s\S]*?height:\s*44,[\s\S]*?borderRadius:\s*22,/);
});

test('exposes the edit-before-send toggle state to Expo Web accessibility APIs', () => {
  assert.match(screenSource, /accessibilityRole="switch"[\s\S]*?aria-checked=\{willCancel\}[\s\S]*?accessibilityState=\{\{ checked: willCancel \}\}/);
});