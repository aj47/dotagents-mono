const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);
const themeProviderSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'ThemeProvider.tsx'),
  'utf8'
);

test('keeps mobile theme preference options simple and explicit', () => {
  assert.match(settingsSource, /const THEME_PREFERENCE_OPTIONS/);
  assert.match(settingsSource, /THEME_PREFERENCE_OPTIONS\.map/);
  assert.doesNotMatch(settingsSource, /THEME_OPTIONS\.map/);
  assert.doesNotMatch(settingsSource, /\u2600\uFE0F|\u{1F319}|\u2699\uFE0F/u);
});

test('uses a named default theme preference in the mobile provider', () => {
  assert.match(themeProviderSource, /export const DEFAULT_THEME_PREFERENCE: ThemeMode = 'system';/);
  assert.match(themeProviderSource, /initialMode = DEFAULT_THEME_PREFERENCE/);
});
