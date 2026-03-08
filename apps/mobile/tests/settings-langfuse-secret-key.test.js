const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('shows an explicit clear action when a Langfuse secret is already configured', () => {
  assert.match(screenSource, /const hasSavedLangfuseSecretKey = remoteSettings\?\.langfuseSecretKey === '••••••••';/);
  assert.match(screenSource, /\{hasSavedLangfuseSecretKey && \([\s\S]*?Clear saved secret key/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Clear saved Langfuse secret key'\)/);
});

test('clears the saved Langfuse secret through an explicit empty-string update', () => {
  assert.match(screenSource, /await settingsClient\.updateSettings\(\{ langfuseSecretKey: '' \}\);/);
  assert.match(screenSource, /setRemoteSettings\(prev => prev \? \{ \.{3}prev, langfuseSecretKey: '' \} : null\);/);
  assert.match(screenSource, /setInputDrafts\(prev => \(\{ \.{3}prev, langfuseSecretKey: '' \}\)\);/);
});

test('re-masks the Langfuse secret draft after saving a replacement key', () => {
  assert.match(screenSource, /if \(value !== undefined && value !== '' && settingsClient\) \{/);
  assert.match(screenSource, /settingsClient\.updateSettings\(\{ langfuseSecretKey: value \}\)\.then\(\(\) => \{[\s\S]*?langfuseSecretKey: '••••••••'[\s\S]*?setInputDrafts\(prev => \(\{ \.{3}prev, langfuseSecretKey: '' \}\)\);/);
});