const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('keeps the settings modal in the navigation stack with the DotAgents header title', () => {
  assert.match(appSource, /name="Settings"[\s\S]*?options=\{\(\{ navigation \}\) => \(\{/);
  assert.match(appSource, /title: 'DotAgents'/);
  assert.match(appSource, /presentation: 'modal'/);
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

test('moves clear all chats into mobile settings', () => {
  assert.match(settingsSource, /<Text style=\{styles\.sectionTitle\}>Chats<\/Text>/);
  assert.match(settingsSource, /Clear all chats/);
  assert.match(settingsSource, /Delete every chat saved in this mobile app, including pinned chats\./);
});

test('sorts mobile skills like desktop without mutating fetched state', () => {
  assert.match(settingsSource, /const displaySkills = useMemo\(\(\) => \[\.\.\.skills\]\.sort\(\(a, b\) => \{/);
  assert.match(settingsSource, /Number\(b\.enabledForProfile\) - Number\(a\.enabledForProfile\)/);
  assert.match(settingsSource, /return a\.name\.localeCompare\(b\.name\);/);
  assert.match(settingsSource, /displaySkills\.map\(\(skill\) => \(/);
});

test('lets mobile delete non-reserved desktop MCP server configs', () => {
  assert.match(settingsSource, /handleMcpServerDelete/);
  assert.match(settingsSource, /settingsClient\.deleteMCPServerConfig\(server\.name\)/);
  assert.match(settingsSource, /isReservedMcpServerName\(server\.name, RESERVED_RUNTIME_TOOL_SERVER_NAMES\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete MCP server \$\{server\.name\}`\)/);
});

test('lets mobile create desktop MCP server configs through the shared client', () => {
  assert.match(settingsSource, /showMcpServerEditor/);
  assert.match(settingsSource, /Create MCP Server/);
  assert.match(settingsSource, /settingsClient\.upsertMCPServerConfig\(draftConfig\.name, draftConfig\.config\)/);
  assert.match(settingsSource, /parseMcpKeyValueDraft\(mcpServerDraft\.env, 'Environment'\)/);
  assert.match(settingsSource, /parseMcpKeyValueDraft\(mcpServerDraft\.headers, 'Header'\)/);
  assert.match(settingsSource, /setMcpServerDraft\(EMPTY_MCP_SERVER_DRAFT\)/);
});

test('lets mobile replace existing MCP server configs without reading secrets', () => {
  assert.match(settingsSource, /openMcpServerReplaceEditor/);
  assert.match(settingsSource, /mcpServerEditorMode === 'replace'/);
  assert.match(settingsSource, /Replace MCP Server/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Replace MCP server \$\{server\.name\} config`\)/);
  assert.match(settingsSource, /mcpServerEditorMode === 'create' && mcpServers\.some/);
});

test('lets mobile import pasted MCP server configs through the shared client', () => {
  assert.match(settingsSource, /showMcpImportModal/);
  assert.match(settingsSource, /Import MCP Servers/);
  assert.match(settingsSource, /parseMcpServerConfigImportRequestBody\(parsedJson\)/);
  assert.match(settingsSource, /settingsClient\.importMCPServerConfigs\(parsedRequest\.request\.config\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Import MCP server JSON'\)/);
  assert.match(settingsSource, /setMcpImportJsonText\(''\)/);
});
