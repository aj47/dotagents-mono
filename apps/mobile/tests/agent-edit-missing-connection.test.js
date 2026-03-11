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
  assert.match(screenSource, /\{!settingsClient && \([\s\S]*?Configure Base URL and API key in Settings to save changes\.[\s\S]*?\)\}/);
});

test('agent edit disables the primary save action until connection settings exist', () => {
  assert.match(screenSource, /const isSaveDisabled = isSaving \|\| !settingsClient;/);
  assert.match(screenSource, /style=\{\[styles\.saveButton, isSaveDisabled && styles\.saveButtonDisabled\]\}/);
  assert.match(screenSource, /disabled=\{isSaveDisabled\}/);
});