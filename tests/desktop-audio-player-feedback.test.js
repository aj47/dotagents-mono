const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const audioPlayerSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'audio-player.tsx'),
  'utf8'
);

test('desktop audio player keeps playback failures visible and locally recoverable', () => {
  assert.match(audioPlayerSource, /function getPlaybackErrorMessage\(error: unknown, mode: "auto" \| "manual"\)/);
  assert.match(audioPlayerSource, /function getMediaElementErrorMessage\(audio: HTMLAudioElement \| null\)/);
  assert.match(audioPlayerSource, /const \[playbackError, setPlaybackError\] = useState<string \| null>\(null\)/);
  assert.match(audioPlayerSource, /setPlaybackError\(getPlaybackErrorMessage\(error, "auto"\)\)/);
  assert.match(audioPlayerSource, /setPlaybackError\(getPlaybackErrorMessage\(playError, "manual"\)\)/);
  assert.match(audioPlayerSource, /setPlaybackError\(getMediaElementErrorMessage\(audio\)\)/);
  assert.match(audioPlayerSource, /Auto-play was blocked by your device or browser\. Press play to listen\./);
  assert.match(audioPlayerSource, /Audio playback was blocked by your device or browser\. Press play to try again\./);
  assert.match(audioPlayerSource, /const compactStatusLabel = hasAudio[\s\S]*\? "Playback failed"/);
  assert.match(audioPlayerSource, /const playbackAlert = playbackError && \([\s\S]*role="alert"[\s\S]*Retry play/);
});