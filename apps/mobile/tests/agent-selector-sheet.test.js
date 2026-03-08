const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sheetSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AgentSelectorSheet.tsx'),
  'utf8'
);

test('refreshes the current profile context when the selector sheet opens', () => {
  assert.match(sheetSource, /if \(visible\) \{[\s\S]*?void Promise\.all\(\[refresh\(\), fetchProfiles\(\)\]\);/);
});

test('keeps the empty state anchored to the current agent and explains where to manage agents', () => {
  assert.match(sheetSource, /Current: \{currentAgentName\}/);
  assert.match(sheetSource, /No switchable agents yet/);
  assert.match(sheetSource, /Manage delegation agents in Settings → Agents\./);
});

test('offers a mobile-friendly path back to agent settings from the empty state', () => {
  assert.match(sheetSource, /navigation\.navigate\('Settings'\)/);
  assert.match(sheetSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open agent settings'\)\}/);
  assert.match(sheetSource, /manageAgentsButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*180,/);
});

test('turns the missing-config error into a direct recovery path to connection settings', () => {
  assert.match(sheetSource, /if \(!hasApiConfig\) \{[\s\S]*?setSelectorMode\('profile'\);[\s\S]*?setError\(missingConfigError\);/);
  assert.match(sheetSource, /const isMissingConfigError = error === missingConfigError;/);
  assert.match(sheetSource, /navigation\.navigate\('ConnectionSettings'\)/);
  assert.match(sheetSource, /accessibilityLabel=\{createButtonAccessibilityLabel\('Open connection settings'\)\}/);
  assert.match(sheetSource, /Open Connection Settings/);
  assert.match(sheetSource, /errorActionButton:\s*\{[\s\S]*?minHeight:\s*44,[\s\S]*?minWidth:\s*220,/);
});