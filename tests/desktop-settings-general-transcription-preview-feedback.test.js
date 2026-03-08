const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-general.tsx'),
  'utf8'
);

const panelSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'panel.tsx'),
  'utf8'
);

const configSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'config.ts'),
  'utf8'
);

const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('desktop settings exposes transcription preview status, cost guidance, and parakeet limitation messaging', () => {
  assert.match(settingsSource, /const transcriptionPreviewEnabled =\s*configQuery\.data\?\.transcriptionPreviewEnabled \?\? false/);
  assert.match(settingsSource, /Live transcription preview is off\. Turn it on to see partial transcript updates while recording\./);
  assert.match(settingsSource, /Parakeet skips live preview during recording right now to avoid expensive local chunk conversion\./);
  assert.match(settingsSource, /Groq about every 10 seconds while you record, and each preview chunk is billed separately with a 10-second minimum per request\./);
  assert.match(settingsSource, /checked=\{transcriptionPreviewEnabled\}/);
  assert.match(settingsSource, /Switch to OpenAI or Groq if you want partial transcripts before you stop\./);
});

test('desktop config and remote settings default transcription preview off, while panel still disables live preview for parakeet', () => {
  assert.match(configSource, /transcriptionPreviewEnabled: false/);
  assert.match(remoteServerSource, /transcriptionPreviewEnabled: cfg\.transcriptionPreviewEnabled \?\? false/);
  assert.match(panelSource, /configQuery\.data\?\.sttProviderId !== "parakeet"/);
  assert.match(panelSource, /Disable transcription preview for Parakeet since live chunk PCM conversion is expensive\./);
});