const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);

test('clears stale message TTS errors before a new read-aloud attempt', () => {
  assert.match(screenSource, /const \[messageTtsError, setMessageTtsError\] = useState<\(ReturnType<typeof getMessageTtsErrorDetails> & \{ index: number \}\) \| null>\(null\);/);
  assert.match(screenSource, /const speakMessage = useCallback\(\(index: number, content: string\) => \{[\s\S]*?setMessageTtsError\(null\);/);
});

test('maps empty-text and speech failures to inline read-aloud guidance', () => {
  assert.match(screenSource, /type MessageTtsErrorOptions = \{/);
  assert.match(screenSource, /const getMessageTtsErrorDetails = \(/);
  assert.match(screenSource, /reason === 'empty_text'[\s\S]*?title: 'Nothing to read aloud'/);
  assert.match(screenSource, /setMessageTtsError\(\{ index, \.\.\.getMessageTtsErrorDetails\(null, \{ reason: 'empty_text' \}\) \}\)/);
  assert.match(screenSource, /onError: \(speechError\) => \{[\s\S]*?setMessageTtsError\(\{ index, \.\.\.getMessageTtsErrorDetails\(speechError, \{ voiceId: config\.ttsVoiceId \}\) \}\)/);
  assert.match(screenSource, /catch \(speechError\) \{[\s\S]*?setMessageTtsError\(\{ index, \.\.\.getMessageTtsErrorDetails\(speechError, \{ voiceId: config\.ttsVoiceId \}\) \}\)/);
});

test('renders retry-focused message-level feedback next to failed read-aloud actions', () => {
  assert.match(screenSource, /messageTtsError\?\.index === i && styles\.speakButtonError/);
  assert.match(screenSource, /messageTtsError\?\.index === i[\s\S]*\? 'Retry read aloud'/);
  assert.match(screenSource, /messageTtsError\?\.index === i[\s\S]*\? 'Retries spoken playback for this message\.'/);
  assert.match(screenSource, /\{messageTtsError\?\.index === i && \([\s\S]*style=\{styles\.messageTtsBanner\}[\s\S]*accessibilityLiveRegion="polite"[\s\S]*aria-live="polite"/);
  assert.match(screenSource, /<Text style=\{styles\.messageTtsBannerTitle\}>\{messageTtsError\.title\}<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.messageTtsBannerText\}>\{messageTtsError\.message\}<\/Text>/);
});