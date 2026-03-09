const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('keeps the root settings orientation in the navigation header', () => {
  assert.match(appSource, /name="Settings"[\s\S]*?options=\{\{ title: 'DotAgents' \}\}/);
});

test('avoids a duplicate in-content Settings title on the root settings screen', () => {
  assert.doesNotMatch(settingsSource, /<Text style=\{styles\.h1\}>Settings<\/Text>/);
});

test('keeps push notifications as a single labeled row instead of a duplicate section header', () => {
  assert.doesNotMatch(settingsSource, /<Text style=\{styles\.sectionTitle\}>Notifications<\/Text>/);
  assert.match(settingsSource, /<View style=\{\[styles\.row, styles\.sectionLeadRow\]\}>[\s\S]*?<Text style=\{styles\.label\}>Push Notifications<\/Text>/);
});

test('preserves breathing room before the push notifications row after removing the extra heading', () => {
  assert.match(settingsSource, /sectionLeadRow:\s*\{[\s\S]*?marginTop: spacing\.lg,/);
});

test('keeps a global save button visible on mobile settings so typed changes are easy to persist', () => {
  assert.match(settingsSource, /Save changes/);
  assert.match(settingsSource, /Save settings now/);
  assert.match(settingsSource, /flushAllSettingsSaves/);
  assert.match(settingsSource, /saveBar:/);
});
