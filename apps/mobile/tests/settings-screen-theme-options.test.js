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

test('uses shared theme preference values in mobile settings', () => {
  assert.match(settingsSource, /THEME_PREFERENCE_OPTIONS/);
  assert.match(settingsSource, /THEME_PREFERENCE_OPTIONS\.map/);
  assert.doesNotMatch(settingsSource, /THEME_OPTION_LABELS/);
  assert.doesNotMatch(settingsSource, /\u2600\uFE0F|\u{1F319}|\u2699\uFE0F/u);
});

test('uses the shared default theme preference in the provider', () => {
  assert.match(themeProviderSource, /DEFAULT_THEME_PREFERENCE/);
  assert.match(themeProviderSource, /initialMode = DEFAULT_THEME_PREFERENCE/);
});
