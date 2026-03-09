const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('explains partial desktop settings load failures and offers an explicit retry action', () => {
  assert.match(screenSource, /<Text style=\{styles\.warningTitle\}>Desktop settings need attention<\/Text>/);
  assert.match(screenSource, /<Text style=\{styles\.warningText\}>\{remoteError\}<\/Text>/);
  assert.match(screenSource, /Some desktop sections may be out of date until the retry finishes\./);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Retry loading desktop settings'\)/);
  assert.match(screenSource, /accessibilityHint="Reloads the desktop settings section and refreshes stale values\."/);
  assert.match(screenSource, /<Text style=\{styles\.warningRetryButtonText\}>Retry loading<\/Text>/);
});

test('keeps the settings warning card and retry action mobile-friendly on narrow screens', () => {
  assert.match(screenSource, /warningContainer:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?gap:\s*spacing\.md,[\s\S]*?alignItems:\s*'stretch',/);
  assert.match(screenSource, /warningContent:\s*\{[\s\S]*?gap:\s*spacing\.xs,/);
  assert.match(screenSource, /warningRetryButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\),[\s\S]*?width:\s*'100%' as const,/);
  assert.match(screenSource, /warningRetryButtonText:\s*\{[\s\S]*?textAlign:\s*'center',[\s\S]*?fontWeight:\s*'600',/);
});