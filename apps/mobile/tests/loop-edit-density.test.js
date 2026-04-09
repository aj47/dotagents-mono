const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'LoopEditScreen.tsx'),
  'utf8'
);

test('keeps mobile loop edit errors text-first without decorative warning emoji', () => {
  assert.doesNotMatch(screenSource, /⚠️/);
  assert.match(screenSource, /\{error && <Text style=\{styles\.errorText\}>\{error\}<\/Text>\}/);
});

test('preserves the inline settings helper when loop editing is unavailable', () => {
  assert.match(
    screenSource,
    /Connect to a DotAgents server in Settings to save changes\./
  );
});
