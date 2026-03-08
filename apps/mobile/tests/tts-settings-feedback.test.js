const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ttsSettingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'TTSSettings.tsx'),
  'utf8'
);

test('surfaces voice-load failures inline and in the picker instead of logging only', () => {
  assert.match(ttsSettingsSource, /const \[voicesLoadError, setVoicesLoadError\] = useState<string \| null>\(null\);/);
  assert.match(ttsSettingsSource, /setVoicesLoadError\(getVoiceLoadErrorMessage\(error\)\);/);
  assert.match(ttsSettingsSource, /voicesLoadError && \([\s\S]*?<Text style=\{\[styles\.helperText, styles\.errorText\]\}>\{voicesLoadError\}<\/Text>/);
  assert.match(ttsSettingsSource, /voices\.length === 0 && \([\s\S]*?\{voicesLoadError \|\| 'No specific voices available right now\.'\}/);
});