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
  assert.match(screenSource, /handsFreeDebounceMs:\s*handsFreeMessageDebounceMs/);
  assert.match(screenSource, /handlePushToTalkPressIn/);
  assert.match(screenSource, /handlePushToTalkPressOut/);
});

test('resets the handsfree controller before shutting down recognizer state when toggled off', () => {
  assert.match(screenSource, /const next = !handsFreeRef\.current;[\s\S]*?handsFreeRef\.current = next;/);
  assert.match(screenSource, /if \(!next\) \{[\s\S]*?handsFreeController\.reset\(\);[\s\S]*?void stopRecognitionOnly\?\.\(\);[\s\S]*?Speech\.stop\(\);[\s\S]*?Handsfree mode turned off\./);
});

test('falls back to normal direct-send handling for stale handsfree finalizations after toggle-off', () => {
  assert.match(screenSource, /if \(mode === 'handsfree'\) \{\s*if \(handsFreeRef\.current\) \{[\s\S]*?handsFreeController\.handleFinalTranscript\(finalText\);[\s\S]*?return;\s*\}\s*\}\s*void sendRef\.current\(finalText\);/);
});

test('surfaces recent voice debug events in chat when internal diagnostics are enabled', () => {
  assert.match(screenSource, /handsFreeDebugEnabled && voiceEvents\.length > 0/);
  assert.match(screenSource, /formatVoiceDebugEntry\(entry\)/);
});

test('blocks disconnected handsfree activation and keeps the fallback copy honest', () => {
  assert.match(screenSource, /if \(next && !hasConnectionConfig\) \{[\s\S]*?Connect in Settings before enabling handsfree\. You can still hold the mic to dictate a draft\./);
  assert.match(screenSource, /Connect in Settings before enabling hands-free mode\. You can still hold the mic to dictate a draft\./);
  assert.match(screenSource, /Connect in Settings before handsfree can send\. Hold the mic to dictate a draft\./);
});