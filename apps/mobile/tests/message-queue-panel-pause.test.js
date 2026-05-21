const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const panelSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'MessageQueuePanel.tsx'),
  'utf8'
);
const chatSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('mobile message queue panel exposes pause and resume chrome without shared presentation code', () => {
  assert.match(panelSource, /isPaused\?: boolean/);
  assert.match(panelSource, /onPause\?: \(\) => void/);
  assert.match(panelSource, /onResume\?: \(\) => void/);
  assert.match(panelSource, /Queue paused\. Messages stay queued until you resume\./);
  assert.match(panelSource, /accessibilityLabel=\{isPaused \? 'Resume queued messages' : 'Pause queued messages'\}/);
  assert.doesNotMatch(panelSource, /session-presentation/);
});

test('chat screen wires queue pause state to handsfree pause state', () => {
  assert.match(chatSource, /const isMessageQueuePaused = handsFree && handsFreeController\.state\.phase === 'paused'/);
  assert.match(chatSource, /isPaused=\{isMessageQueuePaused\}/);
  assert.match(chatSource, /onPause=\{pauseHandsFreeByUser\}/);
  assert.match(chatSource, /onResume=\{resumeHandsFreeByUser\}/);
});
