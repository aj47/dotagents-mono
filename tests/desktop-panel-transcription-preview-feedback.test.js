const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const panelSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'panel.tsx'),
  'utf8'
);

const tipcSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'main', 'tipc.ts'),
  'utf8'
);

test('desktop panel maps preview transcription failures to inline recovery guidance', () => {
  assert.match(panelSource, /const getPreviewTranscriptionErrorMessage = \(error: unknown\) =>/);
  assert.match(panelSource, /Live preview couldn't authenticate with your transcription provider\./);
  assert.match(panelSource, /Live preview hit a provider rate limit\./);
  assert.match(panelSource, /Live preview lost contact with your transcription provider\./);
  assert.match(panelSource, /setPreviewError\(getPreviewTranscriptionErrorMessage\(result\.error\)\)/);
  assert.match(panelSource, /role="alert"/);
});

test('desktop transcribeChunk returns preview-specific errors instead of silently swallowing them', () => {
  assert.match(tipcSource, /const message = `\$\{transcriptResponse\.status\} \$\{transcriptResponse\.statusText\} \$\{errBody\}`\.trim\(\)/);
  assert.match(tipcSource, /return \{ text: "", error: message \}/);
  assert.match(tipcSource, /const message = getErrorMessage\(error, "Live transcription preview failed"\)/);
});