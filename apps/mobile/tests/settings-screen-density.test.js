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

test('lets mobile export MCP server configs through the shared client', () => {
  assert.match(settingsSource, /handleMcpServerExport/);
  assert.match(settingsSource, /settingsClient\.exportMCPServerConfigs\(\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?JSON\.stringify\(result\.config, null, 2\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Export MCP server JSON'\)/);
  assert.match(settingsSource, /MCP config exports can include tokens, headers, and environment variables/);
});

test('lets mobile export DotAgents bundles through the shared client', () => {
  assert.match(settingsSource, /handleBundleExport/);
  assert.match(settingsSource, /settingsClient\.exportBundle\(\{ name: 'DotAgents Bundle' \}\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?message: result\.bundleJson/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Export DotAgents bundle JSON'\)/);
  assert.match(settingsSource, /Bundles can include agents, MCP servers, skills, tasks, and knowledge notes/);
});

test('lets mobile preview and import pasted DotAgents bundles through the shared client', () => {
  assert.match(settingsSource, /showBundleImportModal/);
  assert.match(settingsSource, /Import Bundle/);
  assert.match(settingsSource, /settingsClient\.previewBundleImport\(\{ bundleJson: bundleImportJsonText\.trim\(\) \}\)/);
  assert.match(settingsSource, /settingsClient\.importBundle\(\{[\s\S]*?bundleJson: bundleImportJsonText\.trim\(\),[\s\S]*?conflictStrategy: bundleImportConflictStrategy,[\s\S]*?components: bundleImportComponents/);
  assert.match(settingsSource, /BUNDLE_IMPORT_CONFLICT_STRATEGIES/);
  assert.match(settingsSource, /BUNDLE_IMPORT_COMPONENT_OPTIONS/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Import DotAgents bundle JSON'\)/);
  assert.match(settingsSource, /Preview DotAgents bundle JSON/);
});

test('lets mobile import and export skill Markdown through the shared client', () => {
  assert.match(settingsSource, /showSkillImportModal/);
  assert.match(settingsSource, /Import Skill/);
  assert.match(settingsSource, /settingsClient\.importSkillFromMarkdown\(skillImportMarkdownText\.trim\(\)\)/);
  assert.match(settingsSource, /settingsClient\.exportSkillToMarkdown\(skill\.id\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?message: result\.markdown/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Import skill Markdown'\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Export skill \$\{skill\.name\} as Markdown`\)/);
});

test('lets mobile import GitHub skills through the shared client', () => {
  assert.match(settingsSource, /showSkillGitHubImportModal/);
  assert.match(settingsSource, /Import GitHub Skill/);
  assert.match(settingsSource, /settingsClient\.importSkillFromGitHub\(skillGitHubImportText\.trim\(\)\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Import skill from GitHub'\)/);
  assert.match(settingsSource, /accessibilityLabel="Import GitHub skill"/);
});

test('lets mobile search desktop knowledge notes through the shared client', () => {
  assert.match(settingsSource, /knowledgeNoteSearchQuery/);
  assert.match(settingsSource, /settingsClient\.searchKnowledgeNotes\(\{[\s\S]*?query: trimmedKnowledgeNoteSearchQuery,[\s\S]*?context: knowledgeNoteFilterRequest\.context,[\s\S]*?dateFilter: knowledgeNoteFilterRequest\.dateFilter,[\s\S]*?sort: knowledgeNoteFilterRequest\.sort,[\s\S]*?limit: 100/);
  assert.match(settingsSource, /displayedKnowledgeNotes = trimmedKnowledgeNoteSearchQuery \? knowledgeNoteSearchResults : knowledgeNotes/);
  assert.match(settingsSource, /placeholder="Search notes"/);
  assert.match(settingsSource, /accessibilityLabel="Search knowledge notes"/);
});

test('lets mobile filter and sort desktop knowledge notes through the shared client', () => {
  assert.match(settingsSource, /knowledgeNoteContextFilter/);
  assert.match(settingsSource, /knowledgeNoteDateFilter/);
  assert.match(settingsSource, /knowledgeNoteSortOption/);
  assert.match(settingsSource, /settingsClient\.getKnowledgeNotes\(knowledgeNoteFilterRequest\)/);
  assert.match(settingsSource, /KNOWLEDGE_CONTEXT_FILTER_OPTIONS/);
  assert.match(settingsSource, /KNOWLEDGE_DATE_FILTER_OPTIONS/);
  assert.match(settingsSource, /KNOWLEDGE_SORT_OPTIONS/);
});

test('lets mobile delete selected and all desktop knowledge notes through the shared client', () => {
  assert.match(settingsSource, /selectedKnowledgeNoteIds/);
  assert.match(settingsSource, /toggleKnowledgeNoteSelection/);
  assert.match(settingsSource, /settingsClient\.deleteKnowledgeNotes\(ids\)/);
  assert.match(settingsSource, /settingsClient\.deleteAllKnowledgeNotes\(\)/);
  assert.match(settingsSource, /Delete Selected \(\{visibleSelectedKnowledgeNoteIds\.length\}\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Delete all knowledge notes'\)/);
});

test('lets mobile import and export loop Markdown through the shared client', () => {
  assert.match(settingsSource, /showLoopImportModal/);
  assert.match(settingsSource, /Import Loop/);
  assert.match(settingsSource, /settingsClient\.importLoopFromMarkdown\(loopImportMarkdownText\.trim\(\)\)/);
  assert.match(settingsSource, /settingsClient\.exportLoopToMarkdown\(loop\.id\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?message: result\.markdown/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\('Import loop Markdown'\)/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Export \$\{loop\.name\} loop as Markdown`\)/);
});
