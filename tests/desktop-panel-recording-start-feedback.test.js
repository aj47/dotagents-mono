const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const panelSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'panel.tsx'),
  'utf8'
);

test('desktop panel maps microphone start failures to actionable user-facing guidance', () => {
  assert.match(panelSource, /const getRecordingStartErrorDetails = \(error: unknown\) =>/);
  assert.match(panelSource, /title: "Microphone access needed"/);
  assert.match(panelSource, /Allow microphone access in your system settings, then try recording again\./);
  assert.match(panelSource, /title: "No microphone found"/);
  assert.match(panelSource, /No microphone was found\. Connect or enable a microphone, then try recording again\./);
  assert.match(panelSource, /title: "Microphone unavailable"/);
  assert.match(panelSource, /Close any other app using it, then try recording again\./);
  assert.match(panelSource, /tipcClient\.displayError\(\{ title, message \}\)/);
});

test('desktop panel reuses the same recording-start failure handler across normal and MCP entry points', () => {
  const handlerUses = panelSource.match(/handleRecordingStartFailure\(err/g) || [];
  assert.equal(handlerUses.length, 4);
  assert.match(panelSource, /handleRecordingStartFailure\(err, \{ resetMcpContext: true \}\)/);
});