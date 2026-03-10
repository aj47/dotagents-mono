const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

test('keeps mobile node tests compatible with the repo minimum Node version', () => {
  assert.equal(packageJson.scripts['test:node'], 'node --test "tests/*.js"');
  assert.doesNotMatch(packageJson.scripts['test:node'], /--experimental-strip-types/);
});

test('runs TypeScript-backed mobile utility tests under vitest instead of node --test', () => {
  assert.match(packageJson.scripts['test:vitest'], /src\/screens\/agent-edit-connection-utils\.test\.ts/);
  assert.match(packageJson.scripts['test:vitest'], /src\/screens\/connection-settings-qr\.test\.ts/);
});
