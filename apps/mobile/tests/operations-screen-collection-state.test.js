const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const operationsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'OperationsScreen.tsx'),
  'utf8'
);

test('uses shared collection state helpers for mobile operations expansion state', () => {
  assert.match(operationsSource, /toggleSetValue\(current, serverName\)/);
  assert.match(operationsSource, /if \(!current\.has\(serverName\)\) \{\s*void fetchMcpLogsForServer\(serverName\);/);
  assert.match(operationsSource, /if \(!current\.has\(serverName\)\) \{\s*void fetchMcpToolsForServer\(serverName\);/);
  assert.doesNotMatch(operationsSource, /const next = new Set\(current\);[\s\S]*next\.delete\(serverName\);[\s\S]*next\.add\(serverName\);/);
});
