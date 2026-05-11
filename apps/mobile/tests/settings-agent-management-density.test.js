const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

function sectionMarker(id) {
  return `<CollapsibleSection id="${id}" title={getAppShellMobileSettingsSectionTitle('${id}')}>`;
}

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = settingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('keeps the mobile Agents subsection free of decorative delete emoji chrome', () => {
  const agentsSection = extractBetween(
    sectionMarker('agents'),
    '{/* 4n. Agent Loops */}'
  );

  assert.doesNotMatch(agentsSection, /🗑️/);
  assert.match(agentsSection, /getAppShellAgentActionLabel\('delete'\)/);
  assert.match(agentsSection, /getAppShellAgentDeleteAccessibilityLabel\(profile\.displayName\)/);
  assert.match(agentsSection, /getAppShellAgentListInitial\(profile\)/);
  assert.match(agentsSection, /getAppShellAgentListMetadata\(profile\)/);
  assert.match(agentsSection, /getAppShellAgentListDescription\(profile\)/);
});

test('lets mobile rescan desktop agent profile files from the Agents subsection', () => {
  const agentsSection = extractBetween(
    sectionMarker('agents'),
    '{/* 4n. Agent Loops */}'
  );

  assert.match(settingsSource, /const \[isReloadingAgentProfiles, setIsReloadingAgentProfiles\]/);
  assert.match(settingsSource, /const handleAgentProfilesReload = useCallback\(async \(\) => \{/);
  assert.match(settingsSource, /settingsClient\.reloadAgentProfiles\(\)/);
  assert.match(settingsSource, /setAgentProfiles\(res\.profiles\)/);
  assert.match(agentsSection, /getAppShellAgentRescanActionLabel\(isReloadingAgentProfiles\)/);
  assert.match(agentsSection, /getAppShellAgentRescanAccessibilityLabel\(\)/);
  assert.match(agentsSection, /disabled=\{isReloadingAgentProfiles\}/);
});

test('keeps mobile Agent Loop actions text-first and explicitly labeled', () => {
  const loopsSection = extractBetween(
    sectionMarker('agentLoops'),
    '</CollapsibleSection>'
  );

  assert.doesNotMatch(loopsSection, /▶ Run|🗑 Delete/);
  assert.match(loopsSection, /getAppShellLoopActionLabel\('runNow'\)/);
  assert.match(loopsSection, /getAppShellLoopActionLabel\('delete'\)/);
  assert.match(loopsSection, /getAppShellLoopRunNowAccessibilityLabel\(loop\.name\)/);
  assert.match(loopsSection, /getAppShellLoopDeleteAccessibilityLabel\(loop\.name\)/);
});

test('marks mobile agents with custom system prompts in the settings list', () => {
  const agentsSection = extractBetween(
    sectionMarker('agents'),
    '{/* 4n. Agent Loops */}'
  );

  assert.match(agentsSection, /profile\.systemPrompt\?\.trim\(\)/);
  assert.match(agentsSection, /profile\.systemPrompt\?\.trim\(\) && !profile\.isBuiltIn/);
  assert.match(agentsSection, /Custom prompt/);
  assert.match(agentsSection, /Default system prompt updates are blocked until this custom prompt is reset\./);
});
