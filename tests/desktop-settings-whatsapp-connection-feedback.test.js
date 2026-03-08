const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-whatsapp.tsx'),
  'utf8'
);

test('WhatsApp settings keep initial status loading distinct from unavailable-state warnings', () => {
  assert.match(source, /const \[isRefreshingStatus, setIsRefreshingStatus\] = useState\(false\)/);
  assert.match(source, /const \[hasFetchedStatus, setHasFetchedStatus\] = useState\(false\)/);
  assert.match(source, /if \(!silent\) \{\s*setIsRefreshingStatus\(true\)/);
  assert.match(source, /setHasFetchedStatus\(true\)/);
  assert.match(source, /const isInitialStatusLoading = enabled && !hasFetchedStatus/);
  assert.match(source, /Checking WhatsApp status\.\.\./);
  assert.match(source, /isInitialStatusLoading \? \(/);
});

test('WhatsApp settings show action-local pending labels and disable conflicting connection actions', () => {
  assert.match(source, /const \[pendingConnectionAction, setPendingConnectionAction\] = useState<ConnectionAction \| null>\(null\)/);
  assert.match(source, /const runConnectionAction = useCallback\(async \(action: ConnectionAction, work: \(\) => Promise<void>\) => \{/);
  assert.match(source, /setPendingConnectionAction\(action\)/);
  assert.match(source, /disabled=\{hasPendingConnectionAction \|\| isRefreshingStatus\}/);
  assert.match(source, /Disconnecting\.\.\./);
  assert.match(source, /Refreshing\.\.\./);
  assert.match(source, /Logging out\.\.\./);
  assert.match(source, /const handleRefresh = async \(\) => \{/);
});