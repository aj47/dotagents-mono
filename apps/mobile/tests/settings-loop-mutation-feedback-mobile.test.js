const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('tracks per-loop pending actions and row-local retryable mutation errors', () => {
  assert.match(settingsSource, /type LoopPendingActionKind = 'run' \| 'toggle' \| 'delete';/);
  assert.match(settingsSource, /const \[pendingLoopActionById, setPendingLoopActionById\] = useState<Record<string, LoopPendingAction>>\(\{\}\);/);
  assert.match(settingsSource, /const \[loopActionErrorById, setLoopActionErrorById\] = useState<Record<string, LoopActionError>>\(\{\}\);/);
  assert.match(settingsSource, /const setPendingLoopAction = useCallback\(\(loopId: string, action\?: LoopPendingAction\) => \{/);
  assert.match(settingsSource, /const setLoopActionError = useCallback\(\(loopId: string, error\?: LoopActionError\) => \{/);
  assert.match(settingsSource, /const retryLoopAction = useCallback\(\(loop: Loop, kind: LoopPendingActionKind\) => \{/);
  assert.match(settingsSource, /<View style=\{styles\.inlineLoopWarning\}>[\s\S]*?Retries the last failed loop action for this loop\./);
});

test('loop run, toggle, and delete actions treat false API results as failures', () => {
  assert.match(settingsSource, /const res = await settingsClient\.deleteLoop\(loop\.id\);[\s\S]*?if \(!res\?\.success\) \{/);
  assert.match(settingsSource, /const res = await settingsClient\.toggleLoop\(loop\.id\);[\s\S]*?if \(!res\?\.success\) \{/);
  assert.match(settingsSource, /const res = await settingsClient\.runLoop\(loop\.id\);[\s\S]*?if \(!res\?\.success\) \{/);
  assert.match(settingsSource, /setLoopActionError\(loop\.id, \{[\s\S]*?kind: 'delete'/);
  assert.match(settingsSource, /setLoopActionError\(loop\.id, \{[\s\S]*?kind: 'toggle'/);
  assert.match(settingsSource, /setLoopActionError\(loop\.id, \{[\s\S]*?kind: 'run'/);
});

test('loop rows disable conflicting controls and show pending labels while a mutation is in flight', () => {
  assert.match(settingsSource, /const pendingLoopAction = pendingLoopActionById\[loop\.id\];/);
  assert.match(settingsSource, /const isBusy = Boolean\(pendingLoopAction\);/);
  assert.match(settingsSource, /disabled=\{isBusy\}[\s\S]*?createButtonAccessibilityLabel\(`Edit \$\{loop\.name\} loop`\)/);
  assert.match(settingsSource, /style=\{\[styles\.loopSwitchButton, isBusy && styles\.loopActionButtonDisabled\]\}/);
  assert.match(settingsSource, /style=\{\[styles\.loopActionButton, isBusy && styles\.loopActionButtonDisabled\]\}[\s\S]*?Running\.\.\./);
  assert.match(settingsSource, /Deleting\.\.\./);
  assert.match(settingsSource, /loopActionStatusText:\s*\{[\s\S]*?color: theme\.colors\.primary/);
});