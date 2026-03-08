const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('chat emergency stop uses shared confirmation helpers instead of raw browser dialogs', () => {
  assert.match(screenSource, /const KILL_SWITCH_CONFIRMATION_TITLE = '⚠️ Emergency Stop';/);
  assert.match(screenSource, /const confirmFn = \(globalThis as \{ confirm\?: \(text\?: string\) => boolean \}\)\.confirm;/);
  assert.match(screenSource, /Alert\.alert\(\s*KILL_SWITCH_CONFIRMATION_TITLE,\s*KILL_SWITCH_CONFIRMATION_MESSAGE,/);
  assert.doesNotMatch(screenSource, /window\.confirm\(/);
  assert.doesNotMatch(screenSource, /window\.alert\(/);
});

test('chat emergency stop tracks in-flight state and disables repeated taps while pending', () => {
  assert.match(screenSource, /const \[killSwitchFeedback, setKillSwitchFeedback\] = useState<KillSwitchFeedback \| null>\(null\);/);
  assert.match(screenSource, /const \[killSwitchPending, setKillSwitchPending\] = useState\(false\);/);
  assert.match(screenSource, /const killSwitchPendingRef = useRef\(false\);/);
  assert.match(screenSource, /killSwitchPendingRef\.current = true;[\s\S]*?setKillSwitchPending\(true\);[\s\S]*?title: 'Stopping all sessions\.\.\.'/);
  assert.match(screenSource, /accessibilityLabel=\{killSwitchPending \? 'Emergency stop in progress' : 'Emergency stop - kill all agent sessions'\}/);
  assert.match(screenSource, /disabled=\{killSwitchPending\}/);
  assert.match(screenSource, /killSwitchPending \? \([\s\S]*?<ActivityIndicator size="small" color="#FFFFFF" \/>/);
});

test('chat emergency stop keeps success and failure feedback inline with retry support', () => {
  assert.match(screenSource, /title: 'Emergency stop sent'/);
  assert.match(screenSource, /title: 'Emergency stop failed'/);
  assert.match(screenSource, /\{killSwitchFeedback && \([\s\S]*?killSwitchFeedback\.tone === 'success'[\s\S]*?styles\.killSwitchBannerSuccess/);
  assert.match(screenSource, /killSwitchFeedback\.tone === 'error' && !killSwitchPending[\s\S]*?accessibilityLabel="Retry emergency stop"[\s\S]*?<Text style=\{styles\.retryButtonText\}>Retry<\/Text>/);
});