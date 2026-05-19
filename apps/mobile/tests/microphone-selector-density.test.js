const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MicrophoneSelector.tsx'),
  'utf8'
);

test('keeps the mobile microphone picker touch targets and labels explicit', () => {
  assert.match(source, /const SPEECH_SELECTOR_ACTIVE_OPACITY = 0\.78;/);
  assert.match(source, /activeOpacity=\{SPEECH_SELECTOR_ACTIVE_OPACITY\}/);
  assert.match(source, /accessibilityLabel="Select microphone"/);
  assert.match(source, /accessibilityLabel="Close microphone picker"/);
  assert.match(source, /accessibilityState=\{\{ selected: !selectedDeviceId \}\}/);
  assert.match(source, /accessibilityState=\{\{ selected: selectedDeviceId === device\.deviceId \}\}/);
});

test('clamps microphone picker text so long device names do not resize rows', () => {
  assert.match(source, /const SPEECH_SELECTOR_TEXT_LINES = 2;/);
  assert.match(source, /<Text style=\{styles\.selectorText\} numberOfLines=\{SPEECH_SELECTOR_TEXT_LINES\}>/);
  assert.match(source, /numberOfLines=\{SPEECH_SELECTOR_TEXT_LINES\}[\s\S]*?>\s*System Default/);
  assert.match(source, /numberOfLines=\{SPEECH_SELECTOR_TEXT_LINES\}[\s\S]*?>\s*\{device\.label\}/);
});
