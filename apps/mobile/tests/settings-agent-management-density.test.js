const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = settingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('keeps the mobile Agents subsection free of decorative delete emoji chrome', () => {
  const agentsSection = extractBetween(
    '<CollapsibleSection id="agents" title="Agents">',
    '{/* 4n. Agent Loops */}'
  );

  assert.doesNotMatch(agentsSection, /🗑️/);
  assert.match(agentsSection, /<Text style=\{styles\.agentDeleteButtonText\}>Delete<\/Text>/);
  assert.match(agentsSection, /accessibilityLabel=\{`Delete agent \$\{profile\.displayName\}`\}/);
});

test('lets mobile rescan desktop agent profile files from the Agents subsection', () => {
  const agentsSection = extractBetween(
    '<CollapsibleSection id="agents" title="Agents">',
    '{/* 4n. Agent Loops */}'
  );

  assert.match(settingsSource, /const \[isReloadingAgentProfiles, setIsReloadingAgentProfiles\]/);
  assert.match(settingsSource, /const handleAgentProfilesReload = useCallback\(async \(\) => \{/);
  assert.match(settingsSource, /settingsClient\.reloadAgentProfiles\(\)/);
  assert.match(settingsSource, /setAgentProfiles\(res\.profiles\)/);
  assert.match(agentsSection, /Rescan Files/);
  assert.match(agentsSection, /createButtonAccessibilityLabel\('Rescan agent files'\)/);
  assert.match(agentsSection, /disabled=\{isReloadingAgentProfiles\}/);
});

test('keeps mobile Agent Loop actions text-first and explicitly labeled', () => {
  const loopsSection = extractBetween(
    '<CollapsibleSection id="agentLoops" title="Agent Loops">',
    '</>'
  );

  assert.doesNotMatch(loopsSection, /▶ Run|🗑 Delete/);
  assert.match(loopsSection, /<Text style=\{styles\.loopActionButtonText\}>Run now<\/Text>/);
  assert.match(loopsSection, /<Text style=\{\[styles\.loopActionButtonText, styles\.loopActionButtonTextDanger\]\}>Delete<\/Text>/);
  assert.match(loopsSection, /accessibilityLabel=\{createButtonAccessibilityLabel\(`Run \$\{loop\.name\} loop now`\)\}/);
  assert.match(loopsSection, /accessibilityLabel=\{createButtonAccessibilityLabel\(`Delete \$\{loop\.name\} loop`\)\}/);
});
