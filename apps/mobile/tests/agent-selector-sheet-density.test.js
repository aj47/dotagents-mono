const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const sheetSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AgentSelectorSheet.tsx'),
  'utf8'
);

test('keeps the mobile agent selector close affordance in a compact header instead of a footer band', () => {
  assert.match(sheetSource, /<View style=\{styles\.header\}>/);
  assert.match(sheetSource, /accessibilityLabel="Close agent selector"/);
  assert.match(sheetSource, /<Text style=\{styles\.headerCloseButtonText\}>Close<\/Text>/);
  assert.doesNotMatch(sheetSource, /<Text style=\{styles\.closeButtonText\}>Cancel<\/Text>/);
  assert.doesNotMatch(sheetSource, /closeButton:\s*\{/);
});

test('keeps the mobile agent selector title shrink-safe beside the header close action', () => {
  assert.match(sheetSource, /header:\s*\{[\s\S]*?flexDirection:\s*'row',[\s\S]*?alignItems:\s*'center',[\s\S]*?marginBottom:\s*spacing\.md,/);
  assert.match(sheetSource, /title:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?lineHeight:\s*22,/);
  assert.match(sheetSource, /<Text style=\{styles\.title\} numberOfLines=\{1\}>/);
});

test('uses enabled desktop agent profiles for API-mode chat selection parity', () => {
  assert.match(sheetSource, /setSelectorMode\('profile'\);[\s\S]*?const agentProfilesResponse = await client\.getAgentProfiles\(\);/);
  assert.match(sheetSource, /agentProfilesResponse\.profiles \|\| \[\]\)\.filter\(\(profile\) => profile\.enabled !== false\)/);
  assert.match(sheetSource, /name: profile\.displayName \|\| profile\.name/);
  assert.doesNotMatch(sheetSource, /await client\.getProfiles\(\)/);
});