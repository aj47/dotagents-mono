const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const clientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'openaiClient.ts'),
  'utf8'
);

test('marks fetch-stream cleanup aborts as explicit request cancellation', () => {
  assert.match(
    clientSource,
    /cleanup\(\): void \{[\s\S]*?this\.activeAbortReason = 'Request cancelled';[\s\S]*?this\.activeAbortController\?\.abort\(\);/
  );
});

test('preserves timeout abort reasons separately from explicit cancellation in fetch streaming', () => {
  assert.match(
    clientSource,
    /const timeoutMessage = 'Connection timeout: no data received';[\s\S]*?this\.activeAbortReason = timeoutMessage;[\s\S]*?abortController\.abort\(\);/
  );
  assert.match(
    clientSource,
    /throw new Error\(this\.activeAbortReason \?\? timeoutMessage\);/
  );
  assert.match(
    clientSource,
    /const abortMessage = this\.activeAbortReason \?\? timeoutMessage;[\s\S]*?recovery\?\.markDisconnected\(abortMessage\);[\s\S]*?throw new Error\(abortMessage\);/
  );
});