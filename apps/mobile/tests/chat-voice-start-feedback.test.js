const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

const accessibilitySource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'accessibility.ts'),
  'utf8'
);

test('clears stale voice start errors before each new recording attempt', () => {
  assert.match(screenSource, /const \[voiceStartError, setVoiceStartError\] = useState<ReturnType<typeof getVoiceStartErrorDetails> \| null>\(null\);/);
  assert.match(screenSource, /startingRef\.current = true;[\s\S]*?setVoiceStartError\(null\);[\s\S]*?setListeningValue\(true\);/);
});

test('renders inline voice-start recovery guidance near the mobile composer', () => {
  assert.match(screenSource, /\{voiceStartError && !listening && \(/);
  assert.match(screenSource, /style=\{\[styles\.connectionBanner, styles\.connectionBannerFailed, styles\.voiceStartBanner\]\}/);
  assert.match(screenSource, /<Text style=\{styles\.connectionBannerText\}>\{voiceStartError\.title\}<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.connectionBannerSubtext\}>\{voiceStartError\.message\}<\/Text>/);
});

test('maps common voice startup failures to actionable microphone guidance', () => {
  assert.match(screenSource, /reason\?: 'permission_denied' \| 'api_unavailable' \| 'development_build_required';/);
  assert.match(screenSource, /title: 'Development build required',[\s\S]*?Expo Go does not support speech recognition here\./);
  assert.match(screenSource, /title: 'Microphone access needed',[\s\S]*?Allow microphone and speech recognition access in your device settings/);
  assert.match(screenSource, /title: 'Voice input unavailable',[\s\S]*?Chrome or Edge over HTTPS with microphone access enabled\./);
  assert.match(screenSource, /handleVoiceStartFailure\('Permission denied',[\s\S]*?reason: 'permission_denied'/);
  assert.match(screenSource, /handleVoiceStartFailure\('Web Speech API unavailable',[\s\S]*?reason: 'api_unavailable'/);
});

test('announces failed voice starts through the accessibility live region helper', () => {
  assert.match(accessibilitySource, /voiceError\?: string;/);
  assert.match(accessibilitySource, /const voiceErrorAnnouncement = normalizeVoiceTranscriptForAnnouncement\(voiceError \|\| ''\);/);
  assert.match(accessibilitySource, /if \(voiceErrorAnnouncement\) \{[\s\S]*?return `Voice input error\. \$\{voiceErrorAnnouncement\}`;/);
  assert.match(screenSource, /voiceError: voiceStartError \? `\$\{voiceStartError\.title\}\. \$\{voiceStartError\.message\}` : undefined,/);
});