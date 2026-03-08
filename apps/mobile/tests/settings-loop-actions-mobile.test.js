const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('uses minimum touch targets for loop action controls', () => {
  assert.match(settingsSource, /const compactActionTouchTarget = createMinimumTouchTargetStyle\(\{/);
  assert.match(settingsSource, /loopSwitchButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
  assert.match(settingsSource, /loopActionButton:\s*\{[\s\S]*?\.\.\.compactActionTouchTarget/);
});

test('adds explicit accessibility semantics for loop actions', () => {
  assert.match(settingsSource, /accessibilityRole="switch"[\s\S]*?createSwitchAccessibilityLabel\(`\$\{loop\.name\} loop`\)/);
  assert.match(settingsSource, /renderActionRailSwitchVisual\(loop\.enabled\)/);
  assert.match(settingsSource, /accessibilityElementsHidden[\s\S]*?importantForAccessibility="no-hide-descendants"/);
  assert.match(settingsSource, /accessibilityLabel=\{createButtonAccessibilityLabel\([\s\S]*?`Run \$\{loop\.name\} loop now`/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{loop\.name\} loop`\)/);
});

test('shows loop Run actions as busy and prevents duplicate taps while a trigger request is in flight', () => {
  assert.match(settingsSource, /const \[pendingLoopRunIds, setPendingLoopRunIds\] = useState<string\[\]>\(\[\]\);/);
  assert.match(settingsSource, /if \(!settingsClient \|\| pendingLoopRunIds\.includes\(loopId\)\) return;/);
  assert.match(settingsSource, /setPendingLoopRunIds\(prev => \([\s\S]*?prev\.includes\(loopId\) \? prev : \[\.\.\.prev, loopId\][\s\S]*?\)\);/);
  assert.match(settingsSource, /await settingsClient\.runLoop\(loopId\);[\s\S]*?await fetchLoops\(\);[\s\S]*?Alert\.alert\('Success', 'Loop triggered successfully'\);/);
  assert.match(settingsSource, /finally \{[\s\S]*?setPendingLoopRunIds\(prev => prev\.filter\(id => id !== loopId\)\);[\s\S]*?\}/);
  assert.match(settingsSource, /const isLoopRunPending = pendingLoopRunIds\.includes\(loop\.id\);/);
  assert.match(settingsSource, /style=\{\[[\s\S]*?styles\.loopActionButton,[\s\S]*?isLoopRunPending && styles\.loopActionButtonPending,[\s\S]*?\]\}/);
  assert.match(settingsSource, /disabled=\{isLoopRunPending\}/);
  assert.match(settingsSource, /accessibilityLabel=\{createButtonAccessibilityLabel\([\s\S]*?isLoopRunPending[\s\S]*?`Running \$\{loop\.name\} loop now`[\s\S]*?: `Run \$\{loop\.name\} loop now`[\s\S]*?\)\}/);
  assert.match(settingsSource, /accessibilityHint=\{isLoopRunPending[\s\S]*?This loop is being triggered now\. Wait for the current request to finish\.[\s\S]*?: 'Triggers this loop immediately\.'\}/);
  assert.match(settingsSource, /accessibilityState=\{\{ disabled: isLoopRunPending, busy: isLoopRunPending \}\}/);
  assert.match(settingsSource, /\{isLoopRunPending \? 'Running…' : '▶ Run'\}/);
  assert.match(settingsSource, /loopActionButtonPending:\s*\{[\s\S]*?borderColor: theme\.colors\.primary \+ '2E',[\s\S]*?backgroundColor: theme\.colors\.primary \+ '10',[\s\S]*?opacity: 0\.85,/);
});

test('adds an explicit edit affordance to each loop row', () => {
  assert.match(settingsSource, /onPress=\{\(\) => handleLoopEdit\(loop\)\}[\s\S]*?accessibilityRole="button"/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Edit \$\{loop\.name\} loop`\)/);
  assert.match(settingsSource, /const loopStatusHint = loop\.isRunning[\s\S]*?This loop is running right now\.[\s\S]*?This loop is enabled and waiting for its next run\.[\s\S]*?This loop is paused until you enable it again\./);
  assert.match(settingsSource, /accessibilityHint=\{`Opens this loop so you can review and change its schedule or prompt\. \$\{loopStatusHint\}`\}/);
  assert.match(settingsSource, /renderInlineEditAffordance\(\)/);
});

test('distinguishes running, active, and paused loops in row status styling', () => {
  assert.match(settingsSource, /loop\.isRunning[\s\S]*?\? styles\.statusConnected[\s\S]*?: loop\.enabled[\s\S]*?\? styles\.statusActive[\s\S]*?: styles\.statusDisconnected/);
  assert.match(settingsSource, /statusActive:\s*\{[\s\S]*?backgroundColor: theme\.colors\.primary,/);
});