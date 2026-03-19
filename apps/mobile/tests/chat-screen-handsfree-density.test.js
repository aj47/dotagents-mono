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
  assert.match(screenSource, /<View style=\{styles\.handsFreeStatusRow\}>[\s\S]*?<HandsFreeStatusChip/);
  assert.match(screenSource, /handsFreeController\.statusLabel/);
  assert.match(screenSource, /handsFreeStatusSubtitle/);
});

test('lets handsfree users queue a drafted message without sending immediately', () => {
  assert.match(screenSource, /const queueComposerInput = useCallback\(\(\) => \{[\s\S]*?messageQueue\.enqueue\(currentConversationId, composedMessage\);[\s\S]*?setInput\(''\);[\s\S]*?setPendingImages\(\[\]\);/);
  assert.match(screenSource, /handsFree && messageQueueEnabled && \([\s\S]*?accessibilityLabel=\{createButtonAccessibilityLabel\('Queue message'\)\}[\s\S]*?<Text style=\{styles\.queueButtonText\}>Queue<\/Text>/);
});

test('derives send-next availability from strict FIFO queue semantics', () => {
  assert.match(screenSource, /const nextQueuedMessage = !responding \? messageQueue\.peek\(currentConversationId\) : null;/);
  assert.match(screenSource, /canProcessNext=\{!!nextQueuedMessage\}/);
});

test('wires ChatScreen through the extracted handsfree controller and recognizer hooks', () => {
  assert.match(screenSource, /useSpeechRecognizer\(/);
  assert.match(screenSource, /useHandsFreeController\(/);
  assert.match(screenSource, /handsFreeDebounceMs:\s*handsFreeMessageDebounceMs/);
  assert.match(screenSource, /handlePushToTalkPressIn/);
  assert.match(screenSource, /handlePushToTalkPressOut/);
});

test('resets the handsfree controller before shutting down recognizer state when toggled off', () => {
  assert.match(screenSource, /const next = !handsFreeRef\.current;\s*handsFreeRef\.current = next;/);
  assert.match(screenSource, /if \(!next\) \{[\s\S]*?handsFreeController\.reset\(\);[\s\S]*?void stopRecognitionOnly\?\.\(\);[\s\S]*?Speech\.stop\(\);[\s\S]*?Handsfree mode turned off\./);
});

test('falls back to normal direct-send handling for stale handsfree finalizations after toggle-off', () => {
  assert.match(screenSource, /if \(mode === 'handsfree'\) \{\s*if \(handsFreeRef\.current\) \{[\s\S]*?handsFreeController\.handleFinalTranscript\(finalText\);[\s\S]*?return;\s*\}\s*\}\s*void sendRef\.current\(finalText\);/);
});

test('surfaces recent voice debug events in chat when internal diagnostics are enabled', () => {
  assert.match(screenSource, /handsFreeDebugEnabled && voiceEvents\.length > 0/);
  assert.match(screenSource, /formatVoiceDebugEntry\(entry\)/);
});

test('consolidates handsfree pause and resume onto the mic while keeping the inline control row to a single wake-or-sleep action', () => {
  assert.match(screenSource, /<View style=\{styles\.handsFreeControlsRow\}>[\s\S]*?handsFreeController\.state\.phase === 'sleeping'[\s\S]*?onPress=\{handsFreeController\.wakeByUser\}[\s\S]*?<Text style=\{styles\.handsFreeControlButtonText\}>Wake<\/Text>[\s\S]*?onPress=\{handsFreeController\.sleepByUser\}[\s\S]*?<Text style=\{styles\.handsFreeControlButtonText\}>Sleep<\/Text>[\s\S]*?<\/View>/);
  assert.match(screenSource, /onPress=\{handsFree \? \(\) => \{[\s\S]*?handsFreeController\.state\.phase === 'paused'[\s\S]*?handsFreeController\.resumeByUser\(\)[\s\S]*?handsFreeController\.pauseByUser\(\)[\s\S]*?\} : undefined\}/);
});