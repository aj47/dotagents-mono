const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SessionListScreen.tsx'),
  'utf8'
);

test('filters non-actionable sync errors and summarizes sync failures for the sessions screen', () => {
  assert.match(screenSource, /const SYNC_ALREADY_IN_PROGRESS_ERROR = 'Sync already in progress';/);
  assert.match(screenSource, /function getActionableSyncErrors\(lastSyncResult: SessionStore\['lastSyncResult'\]\): string\[\]/);
  assert.match(screenSource, /filter\(\(error\) => error && error !== SYNC_ALREADY_IN_PROGRESS_ERROR\)/);
  assert.match(screenSource, /function getSessionSyncErrorSummary\(errors: string\[\]\): \{ title: string; detail: string \}/);
  assert.match(screenSource, /title: 'Chat sync needs attention'/);
  assert.match(screenSource, /title: `Chat sync hit \$\{errors.length\} issues`/);
});

test('renders a dismissible sync warning banner with retry and dismiss actions', () => {
  assert.match(screenSource, /const showSyncErrorBanner = Boolean\([\s\S]*?dismissedSyncErrorSignature !== syncErrorSignature/);
  assert.match(screenSource, /<View style=\{styles\.syncErrorBanner\}>[\s\S]*?\{syncErrorSummary.title\}[\s\S]*?\{syncErrorSummary.detail\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Retry chat sync'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Dismiss chat sync warning'\)/);
  assert.match(screenSource, /syncErrorPrimaryAction:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(/);
  assert.match(screenSource, /syncErrorDismissAction:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(/);
});

test('retries chat sync from the sessions banner using the current connection config', () => {
  assert.match(screenSource, /const handleRetrySync = useCallback\(async \(\) => \{/);
  assert.match(screenSource, /if \(!config.baseUrl \|\| !config.apiKey \|\| sessionStore.isSyncing\) \{/);
  assert.match(screenSource, /const client = new ExtendedSettingsApiClient\(config.baseUrl, config.apiKey\);/);
  assert.match(screenSource, /await sessionStore\.syncWithServer\(client\);/);
});