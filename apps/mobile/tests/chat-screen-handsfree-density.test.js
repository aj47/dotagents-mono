const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('renders the extracted handsfree status chip in the mobile chat composer', () => {
  assert.match(screenSource, /<HandsFreeStatusChip/);
  assert.match(screenSource, /handsFreeController\.statusLabel/);
  assert.match(screenSource, /handsFreeStatusSubtitle/);
});

test('wires ChatScreen through the extracted handsfree controller and recognizer hooks', () => {
  assert.match(screenSource, /useSpeechRecognizer\(/);
  assert.match(screenSource, /useHandsFreeController\(/);
  assert.match(screenSource, /handlePushToTalkPressIn/);
  assert.match(screenSource, /handlePushToTalkPressOut/);
});

test('surfaces recent voice debug events in chat when internal diagnostics are enabled', () => {
  assert.match(screenSource, /handsFreeDebugEnabled && voiceEvents\.length > 0/);
  assert.match(screenSource, /formatVoiceDebugEntry\(entry\)/);
});