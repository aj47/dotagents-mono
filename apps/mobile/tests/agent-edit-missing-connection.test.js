const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

test('agent edit surfaces missing-connection guidance instead of silently no-oping', () => {
  assert.match(screenSource, /if \(!settingsClient\) \{[\s\S]*?setError\('Configure Base URL and API key in Settings before saving'\);[\s\S]*?return;[\s\S]*?\}/);
  assert.match(screenSource, /\{!settingsClient && \([\s\S]*?Connection settings are required before you can create or edit agents\.[\s\S]*?\)\}/);
  assert.match(screenSource, /const primaryActionLabel = !isConnectionConfigured[\s\S]*?'Open Connection Settings'/);
  assert.match(screenSource, /onPress=\{isConnectionConfigured \? handleSave : openConnectionSettings\}/);
});

test('agent edit disables form controls while disconnected instead of letting users draft unsavable changes', () => {
  assert.match(screenSource, /const isFormDisabled = isSaving \|\| !isConnectionConfigured;/);
  assert.match(screenSource, /const isGeneralFieldsDisabled = isFormDisabled \|\| isBuiltInAgent;/);
  assert.match(screenSource, /editable=\{!isGeneralFieldsDisabled\}/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: formData\.connectionType === ct\.value, disabled: isGeneralFieldsDisabled \}\}/);
  assert.match(screenSource, /disabled=\{isFormDisabled\}/);
});