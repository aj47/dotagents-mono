const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('tracks automatic assistant TTS failures with retryable state', () => {
  assert.match(screenSource, /const \[autoResponseTtsError, setAutoResponseTtsError\] = useState<\(ReturnType<typeof getAutoResponseTtsErrorDetails> & \{ text: string \}\) \| null>\(null\);/);
  assert.match(screenSource, /const clearAutoResponseTtsError = useCallback\(\(\) => \{[\s\S]*?autoResponseTtsRequestIdRef\.current \+= 1;[\s\S]*?setAutoResponseTtsError\(null\);/);
  assert.match(screenSource, /const playAutomaticResponseTts = useCallback\(\(text: string\) => \{[\s\S]*?const handleAutomaticTtsFailure = \(speechError: unknown\) => \{[\s\S]*?setAutoResponseTtsError\(\{[\s\S]*?text,[\s\S]*?\.\.\.getAutoResponseTtsErrorDetails\(speechError, \{ voiceId: config\.ttsVoiceId \}\),[\s\S]*?\}\);[\s\S]*?onError: handleAutomaticTtsFailure,[\s\S]*?Speech\.speak\(processedText, speechOptions\);[\s\S]*?return true;[\s\S]*?catch \(speechError\) \{[\s\S]*?handleAutomaticTtsFailure\(speechError\);[\s\S]*?return false;/);
});

test('only marks mid-turn auto TTS as played when playback actually starts', () => {
  assert.match(screenSource, /midTurnTTSPlayed = playAutomaticResponseTts\(lastUserResponse\);/);
  assert.doesNotMatch(screenSource, /midTurnTTSPlayed = true;[\s\S]*?Speech\.speak\(processedText, speechOptions\);/);
});

test('reuses the automatic TTS helper for final assistant playback in both send paths', () => {
  const finalPlaybackCalls = screenSource.match(/playAutomaticResponseTts\(ttsText\);/g) || [];
  assert.ok(finalPlaybackCalls.length >= 2, 'expected final assistant playback to use the shared helper in both send paths');
});

test('renders an inline retry banner when automatic assistant read aloud fails', () => {
  assert.match(screenSource, /\{autoResponseTtsError && ttsEnabled && \([\s\S]*?styles\.autoResponseTtsBanner[\s\S]*?accessibilityLiveRegion="polite"[\s\S]*?accessibilityLabel="Retry assistant read aloud"[\s\S]*?<Text style=\{styles\.retryButtonText\}>Retry read aloud<\/Text>/);
});