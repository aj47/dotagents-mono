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
    /Configure Base URL and API key in Settings to save changes\./
  );
});

test('surfaces a loop-specific max-iteration field with inherit-default guidance', () => {
  assert.match(screenSource, /maxIterationsDraft:\s*string/);
  assert.match(screenSource, /maxIterationsDraft:\s*''/);
  assert.match(screenSource, /formatMaxIterationsDraft\(loopFromRoute\.maxIterations\)/);
  assert.match(screenSource, /formatMaxIterationsDraft\(loop\.maxIterations\)/);
  assert.match(screenSource, /Max Iterations \(optional\)/);
  assert.match(screenSource, /Leave blank to inherit the desktop default\./);
});

test('sends explicit mobile max-iteration overrides and can clear them on update', () => {
  assert.match(screenSource, /const parsedMaxIterations = parseMaxIterationsDraft\(formData\.maxIterationsDraft\)/);
  assert.match(screenSource, /setError\('Max iterations must be a positive whole number'\)/);
  assert.match(screenSource, /maxIterations:\s*parsedMaxIterations \?\? null/);
  assert.match(screenSource, /\.\.\.\(parsedMaxIterations !== undefined && \{ maxIterations: parsedMaxIterations \}\)/);
});
