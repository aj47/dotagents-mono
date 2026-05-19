const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ConnectionStatusIndicator.tsx'),
  'utf8'
);

test('mobile connection status indicator keeps status copy and colors local', () => {
  assert.match(source, /formatConnectionStatusIndicatorLabel/);
  assert.match(source, /isConnectionStatusIndicatorPulsing/);
  assert.match(source, /Reconnecting \(\$\{retryCount\}\)/);
  assert.match(source, /theme\.colors\.success/);
  assert.match(source, /theme\.colors\.warning/);
  assert.match(source, /theme\.colors\.destructive/);
  assert.match(source, /theme\.colors\.mutedForeground/);
  assert.doesNotMatch(source, /from '@dotagents\/shared\/session-presentation'/);
  assert.doesNotMatch(source, /ConnectionStatusIndicatorMobileStyles/);
  assert.doesNotMatch(source, /#22c55e|#f59e0b|#ef4444|#6b7280/);
});
