const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(path.join(__dirname, '..', 'App.tsx'), 'utf8');
const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);
const settingsLayoutSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'ui', 'AppShellSettingsLayout.tsx'),
  'utf8'
);

test('keeps the settings modal in the navigation stack with the DotAgents header title', () => {
  assert.match(appSource, /name="Settings"[\s\S]*?options=\{\(\{ navigation \}\) => \(\{/);
  assert.match(appSource, /title: APP_SHELL_MOBILE_ROUTE_TITLES\.Settings/);
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
  assert.match(settingsSource, /footer=\{\(/);
  assert.match(settingsLayoutSource, /footer:/);
  assert.match(settingsLayoutSource, /paddingBottom: Math\.max\(insets\.bottom, spacing\.sm\)/);
});

test('moves clear all chats into mobile settings', () => {
  assert.match(settingsSource, /<Text style=\{styles\.sectionTitle\}>Chats<\/Text>/);
  assert.match(settingsSource, /DEFAULT_CONVERSATIONS_ENABLED/);
  assert.match(settingsSource, /DEFAULT_AUTO_SAVE_CONVERSATIONS/);
  assert.match(settingsSource, /DEFAULT_MAX_CONVERSATIONS_TO_KEEP/);
  assert.match(settingsSource, /remoteSettings\.conversationsEnabled \?\? DEFAULT_CONVERSATIONS_ENABLED/);
  assert.match(settingsSource, /handleRemoteSettingToggle\('conversationsEnabled', v\)/);
  assert.match(settingsSource, /remoteSettings\.autoSaveConversations \?\? DEFAULT_AUTO_SAVE_CONVERSATIONS/);
  assert.match(settingsSource, /handleRemoteSettingToggle\('autoSaveConversations', v\)/);
  assert.match(settingsSource, /inputDrafts\.maxConversationsToKeep \?\? String\(DEFAULT_MAX_CONVERSATIONS_TO_KEEP\)/);
  assert.match(settingsSource, /parseMaxConversationsToKeepDraft\(inputDrafts\.maxConversationsToKeep \?\? ''\)/);
  assert.match(settingsSource, /updates\.maxConversationsToKeep = parsedMaxConversations/);
  assert.match(settingsSource, /Clear all chats/);
  assert.match(settingsSource, /Delete every chat saved in this mobile app, including pinned chats\./);
});

test('sorts mobile skills like desktop without mutating fetched state', () => {
  assert.match(settingsSource, /sortSkillsByProfileEnablement\(skills\)/);
  assert.match(settingsSource, /displaySkills\.map\(\(skill\) => \{/);
});

test('lets mobile edit desktop model presets through shared draft helpers', () => {
  assert.match(settingsSource, /APP_SHELL_MODEL_PRESET_PRESENTATION/);
  assert.match(settingsSource, /APP_SHELL_MODEL_PRESET_PRESENTATION\.manager\.title/);
  assert.match(settingsSource, /APP_SHELL_MODEL_PRESET_PRESENTATION\.fields\.name\.label/);
  assert.match(settingsSource, /APP_SHELL_MODEL_PRESET_PRESENTATION\.fields\.baseUrl\.label/);
  assert.match(settingsSource, /APP_SHELL_MODEL_PRESET_PRESENTATION\.fields\.apiKey\.configuredPlaceholder/);
  assert.match(settingsSource, /getAppShellModelPresetEditorTitle\(presetEditorMode, presetDraft\.isBuiltIn\)/);
  assert.match(settingsSource, /formatAppShellModelPresetCount\(remoteSettings\?\.availablePresets\?\.length \|\| 0\)/);
  assert.doesNotMatch(settingsSource, /New Endpoint/);
  assert.doesNotMatch(settingsSource, /Select Endpoint/);
  assert.match(settingsSource, /EMPTY_MODEL_PRESET_DRAFT/);
  assert.match(settingsSource, /type ModelPresetDraft/);
  assert.match(settingsSource, /buildModelPresetDraftFromSummary\(preset\)/);
  assert.match(settingsSource, /buildModelPresetPayloadFromDraft\(presetDraft\)/);
  assert.match(settingsSource, /settingsClient\.createModelPreset\(draftPayload\.payload\)/);
  assert.match(settingsSource, /settingsClient\.updateModelPreset\(presetDraft\.id, draftPayload\.payload\)/);
});

test('lets mobile delete non-reserved desktop MCP server configs', () => {
  assert.match(settingsSource, /handleMcpServerDelete/);
  assert.match(settingsSource, /settingsClient\.deleteMCPServerConfig\(server\.name\)/);
  assert.match(settingsSource, /isReservedMcpServerName\(server\.name, RESERVED_RUNTIME_TOOL_SERVER_NAMES\)/);
  assert.match(settingsSource, /getAppShellMcpServerItemActionAccessibilityLabel\('delete', server\.name\)/);
});

test('lets mobile create desktop MCP server configs through the shared client', () => {
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION/);
  assert.match(settingsSource, /showMcpServerEditor/);
  assert.match(settingsSource, /getAppShellMcpServerActionLabel\('addServer'\)/);
  assert.match(settingsSource, /settingsClient\.upsertMCPServerConfig\(draftConfig\.name, draftConfig\.config\)/);
  assert.match(settingsSource, /buildMcpServerConfigFromDraft\(mcpServerDraft, \{/);
  assert.match(settingsSource, /existingServerNames: getMcpServerNamesInList\(mcpServers\)/);
  assert.match(settingsSource, /reservedServerNames: RESERVED_RUNTIME_TOOL_SERVER_NAMES/);
  assert.match(settingsSource, /setMcpServerDraft\(EMPTY_MCP_SERVER_DRAFT\)/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.fields\.name\.label/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.fields\.transport\.label/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.fields\.command\.placeholder/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.transports\[transport\.value\]/);
});

test('lets mobile configure OAuth for streamable HTTP MCP servers', () => {
  assert.match(settingsSource, /EMPTY_MCP_SERVER_CONFIG_DRAFT as EMPTY_MCP_SERVER_DRAFT/);
  assert.match(settingsSource, /MCP_TRANSPORT_OPTIONS\.map/);
  assert.match(settingsSource, /type McpServerConfigDraft as McpServerDraft/);
  assert.match(settingsSource, /mcpServerDraft\.transport === 'streamableHttp'/);
  assert.doesNotMatch(settingsSource, /\(\['stdio', 'streamableHttp', 'websocket'\] as MCPTransportType\[\]\)/);
  assert.match(settingsSource, /handleMcpServerDraftChange\('oauthEnabled', v\)/);
  assert.match(settingsSource, /handleMcpServerDraftChange\('oauthScope', v\)/);
  assert.match(settingsSource, /handleMcpServerDraftChange\('oauthClientId', v\)/);
  assert.match(settingsSource, /handleMcpServerDraftChange\('oauthUseDiscovery', v\)/);
  assert.match(settingsSource, /handleMcpServerDraftChange\('oauthUseDynamicRegistration', v\)/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.fields\.oauth\.scopeLabel/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.fields\.oauth\.clientIdLabel/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.fields\.oauth\.discoveryLabel/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_EDITOR_PRESENTATION\.fields\.oauth\.dynamicRegistrationLabel/);
});

test('lets mobile replace existing MCP server configs without reading secrets', () => {
  assert.match(settingsSource, /openMcpServerReplaceEditor/);
  assert.match(settingsSource, /mcpServerEditorMode === 'replace'/);
  assert.match(settingsSource, /getAppShellMcpServerEditorTitle\(mcpServerEditorMode === 'create' \? 'create' : 'replace'\)/);
  assert.match(settingsSource, /getAppShellMcpServerItemActionAccessibilityLabel\('replace', server\.name\)/);
  assert.match(settingsSource, /mode: mcpServerEditorMode/);
});

test('lets mobile import pasted MCP server configs through the shared client', () => {
  assert.match(settingsSource, /showMcpImportModal/);
  assert.match(settingsSource, /getAppShellMcpServerActionLabel\('importServers'\)/);
  assert.match(settingsSource, /parseMcpServerConfigImportRequestBody\(parsedJson\)/);
  assert.match(settingsSource, /settingsClient\.importMCPServerConfigs\(parsedRequest\.request\.config\)/);
  assert.match(settingsSource, /getAppShellMcpServerImportJsonAccessibilityLabel\(\)/);
  assert.match(settingsSource, /setMcpImportJsonText\(''\)/);
});

test('lets mobile export MCP server configs through the shared client', () => {
  assert.match(settingsSource, /handleMcpServerExport/);
  assert.match(settingsSource, /settingsClient\.exportMCPServerConfigs\(\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?JSON\.stringify\(result\.config, null, 2\)/);
  assert.match(settingsSource, /getAppShellMcpServerExportJsonAccessibilityLabel\(\)/);
  assert.match(settingsSource, /APP_SHELL_MCP_SERVER_FEEDBACK_PRESENTATION\.importExport\.exportWarning/);
});

test('lets mobile start and revoke desktop MCP OAuth flows through the shared client', () => {
  assert.match(settingsSource, /McpOAuthStatusResponse/);
  assert.match(settingsSource, /refreshMcpOAuthStatuses/);
  assert.match(settingsSource, /settingsClient\.getMcpOAuthStatus\(server\.name\)/);
  assert.match(settingsSource, /settingsClient\.initiateMcpOAuthFlow\(serverName\)/);
  assert.match(settingsSource, /settingsClient\.revokeMcpOAuthTokens\(serverName\)/);
  assert.match(settingsSource, /OAuth \$\{oauthStatus\.authenticated \? 'connected' : 'needs auth'\}/);
  assert.match(settingsSource, /getAppShellMcpServerItemActionAccessibilityLabel\('startOAuth', server\.name\)/);
  assert.match(settingsSource, /getAppShellMcpServerItemActionAccessibilityLabel\('revokeOAuth', server\.name\)/);
});

test('lets mobile manage desktop ChatGPT Web OAuth through the shared client', () => {
  assert.match(settingsSource, /ChatGptWebAuthStatus/);
  assert.match(settingsSource, /refreshChatGptWebAuthStatus/);
  assert.match(settingsSource, /settingsClient\.getChatGptWebAuthStatus\(\)/);
  assert.match(settingsSource, /settingsClient\.loginChatGptWebOAuth\(\)/);
  assert.match(settingsSource, /settingsClient\.logoutChatGptWebOAuth\(\)/);
  assert.match(settingsSource, /APP_SHELL_PROVIDER_SETUP_PRESENTATION\.chatGptWeb\.oauthTitle/);
  assert.match(settingsSource, /APP_SHELL_PROVIDER_SETUP_PRESENTATION\.chatGptWeb\.callbackUrlLabel/);
  assert.match(settingsSource, /APP_SHELL_PROVIDER_SETUP_PRESENTATION\.chatGptWeb\.connectAccessibilityLabel/);
  assert.match(settingsSource, /APP_SHELL_PROVIDER_SETUP_PRESENTATION\.chatGptWeb\.disconnectAccessibilityLabel/);
});

test('lets mobile export DotAgents bundles through the shared client', () => {
  assert.match(settingsSource, /handleBundleExport/);
  assert.match(settingsSource, /settingsClient\.exportBundle\(\{ name: APP_SHELL_BUNDLE_IMPORT_PRESENTATION\.defaultBundleName \}\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?message: result\.bundleJson/);
  assert.match(settingsSource, /getAppShellBundleExportJsonAccessibilityLabel\(\)/);
  assert.match(settingsSource, /APP_SHELL_BUNDLE_IMPORT_PRESENTATION\.exportDescription/);
  assert.match(settingsSource, /formatAppShellBundleExportStatus\(itemCount\)/);
});

test('lets mobile preview and import pasted DotAgents bundles through the shared client', () => {
  assert.match(settingsSource, /showBundleImportModal/);
  assert.match(settingsSource, /APP_SHELL_BUNDLE_IMPORT_PRESENTATION\.title/);
  assert.match(settingsSource, /settingsClient\.previewBundleImport\(\{ bundleJson: bundleImportJsonText\.trim\(\) \}\)/);
  assert.match(settingsSource, /settingsClient\.importBundle\(\{[\s\S]*?bundleJson: bundleImportJsonText\.trim\(\),[\s\S]*?conflictStrategy: bundleImportConflictStrategy,[\s\S]*?components: bundleImportComponents/);
  assert.match(settingsSource, /BUNDLE_IMPORT_CONFLICT_STRATEGY_OPTIONS/);
  assert.match(settingsSource, /BUNDLE_COMPONENT_OPTIONS/);
  assert.match(settingsSource, /getAppShellBundleComponentLabel\(component\.key, 'compact'\)/);
  assert.match(settingsSource, /formatAppShellBundleComponentSummary\(count, conflicts\)/);
  assert.match(settingsSource, /formatAppShellBundlePreviewStatus\(itemCount\)/);
  assert.match(settingsSource, /formatAppShellBundleImportStatus\(importedCount\)/);
  assert.match(settingsSource, /formatAppShellBundleImportCompleteMessage\(importedCount\)/);
  assert.match(settingsSource, /hasSelectedBundleComponent\(bundleImportComponents\)/);
  assert.match(settingsSource, /getBundleImportChangedItemCount\(result\)/);
  assert.match(settingsSource, /getAppShellBundleImportJsonAccessibilityLabel\(\)/);
  assert.match(settingsSource, /getAppShellBundlePreviewJsonAccessibilityLabel\(\)/);
});

test('lets mobile import and export skill Markdown through the shared client', () => {
  assert.match(settingsSource, /showSkillImportModal/);
  assert.match(settingsSource, /getAppShellSkillActionLabel\('importSkill'\)/);
  assert.match(settingsSource, /settingsClient\.importSkillFromMarkdown\(skillImportMarkdownText\.trim\(\)\)/);
  assert.match(settingsSource, /settingsClient\.exportSkillToMarkdown\(skill\.id\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?message: result\.markdown/);
  assert.match(settingsSource, /getAppShellSkillImportMarkdownAccessibilityLabel\(\)/);
  assert.match(settingsSource, /getAppShellSkillExportMarkdownAccessibilityLabel\(skill\.name\)/);
});

test('lets mobile import GitHub skills through the shared client', () => {
  assert.match(settingsSource, /showSkillGitHubImportModal/);
  assert.match(settingsSource, /getAppShellSkillActionLabel\('importSkillFromGitHubTitle'\)/);
  assert.match(settingsSource, /settingsClient\.importSkillFromGitHub\(skillGitHubImportText\.trim\(\)\)/);
  assert.match(settingsSource, /getAppShellSkillImportGitHubAccessibilityLabel\(\)/);
});

test('lets mobile bulk-delete selected desktop skills through the shared client', () => {
  assert.match(settingsSource, /const \[selectedSkillIds, setSelectedSkillIds\] = useState<Set<string>>\(new Set\(\)\)/);
  assert.match(settingsSource, /const visibleSelectedSkillIds = useMemo/);
  assert.match(settingsSource, /toggleSkillSelection\(skill\.id\)/);
  assert.match(settingsSource, /settingsClient\.deleteSkills\(visibleSelectedSkillIds\)/);
  assert.match(settingsSource, /formatAppShellSkillBulkActionLabel\('deleteSelected', visibleSelectedSkillIds\.length\)/);
  assert.match(settingsSource, /getAppShellSkillSelectionAccessibilityLabel\(skill\.name, isSelected\)/);
});

test('lets mobile search desktop knowledge notes through the shared client', () => {
  assert.match(settingsSource, /knowledgeNoteSearchQuery/);
  assert.match(settingsSource, /settingsClient\.searchKnowledgeNotes\(\{[\s\S]*?query: trimmedKnowledgeNoteSearchQuery,[\s\S]*?context: knowledgeNoteFilterRequest\.context,[\s\S]*?dateFilter: knowledgeNoteFilterRequest\.dateFilter,[\s\S]*?sort: knowledgeNoteFilterRequest\.sort,[\s\S]*?limit: 100/);
  assert.match(settingsSource, /displayedKnowledgeNotes = trimmedKnowledgeNoteSearchQuery \? knowledgeNoteSearchResults : knowledgeNotes/);
  assert.match(settingsSource, /getAppShellKnowledgeNoteActionLabel\('searchPlaceholder'\)/);
  assert.match(settingsSource, /getAppShellKnowledgeNoteActionLabel\('searchAccessibilityLabel'\)/);
});

test('lets mobile filter and sort desktop knowledge notes through the shared client', () => {
  assert.match(settingsSource, /knowledgeNoteContextFilter/);
  assert.match(settingsSource, /knowledgeNoteDateFilter/);
  assert.match(settingsSource, /knowledgeNoteSortOption/);
  assert.match(settingsSource, /settingsClient\.getKnowledgeNotes\(knowledgeNoteFilterRequest\)/);
  assert.match(settingsSource, /KNOWLEDGE_NOTE_CONTEXT_FILTER_OPTIONS/);
  assert.match(settingsSource, /KNOWLEDGE_NOTE_DATE_FILTER_OPTIONS/);
  assert.match(settingsSource, /KNOWLEDGE_NOTE_SORT_OPTIONS/);
  assert.match(settingsSource, /option\.compactLabel/);
});

test('lets mobile delete selected and all desktop knowledge notes through the shared client', () => {
  assert.match(settingsSource, /selectedKnowledgeNoteIds/);
  assert.match(settingsSource, /toggleKnowledgeNoteSelection/);
  assert.match(settingsSource, /settingsClient\.deleteKnowledgeNotes\(ids\)/);
  assert.match(settingsSource, /settingsClient\.deleteAllKnowledgeNotes\(\)/);
  assert.match(settingsSource, /formatAppShellKnowledgeNoteBulkActionLabel\('deleteSelected', visibleSelectedKnowledgeNoteIds\.length\)/);
  assert.match(settingsSource, /getAppShellKnowledgeNoteDeleteSelectedAccessibilityLabel\(visibleSelectedKnowledgeNoteIds\.length\)/);
  assert.match(settingsSource, /getAppShellKnowledgeNoteDeleteAllAccessibilityLabel\(\)/);
});

test('lets mobile import and export loop Markdown through the shared client', () => {
  assert.match(settingsSource, /showLoopImportModal/);
  assert.match(settingsSource, /getAppShellLoopActionLabel\('importLoop'\)/);
  assert.match(settingsSource, /settingsClient\.importLoopFromMarkdown\(loopImportMarkdownText\.trim\(\)\)/);
  assert.match(settingsSource, /settingsClient\.exportLoopToMarkdown\(loop\.id\)/);
  assert.match(settingsSource, /Share\.share\(\{[\s\S]*?message: result\.markdown/);
  assert.match(settingsSource, /DEFAULT_REPEAT_TASK_IMPORT_MARKDOWN_PLACEHOLDER/);
  assert.doesNotMatch(settingsSource, /DEFAULT_LOOP_IMPORT_MARKDOWN_PLACEHOLDER/);
  assert.match(settingsSource, /getAppShellLoopImportMarkdownAccessibilityLabel\(\)/);
  assert.match(settingsSource, /getAppShellLoopExportMarkdownAccessibilityLabel\(loop\.name\)/);
});

test('lets mobile start and stop desktop loop schedules through the shared client', () => {
  assert.match(settingsSource, /loopRuntimeAction/);
  assert.match(settingsSource, /describeRepeatTaskRuntime\(loop/);
  assert.match(settingsSource, /const loopLastRunAt = loop\.lastRunAt/);
  assert.match(settingsSource, /formatAppShellLoopLastRunLabel\(formatRepeatTaskRuntimeTimestampOrFallback\(loopLastRunAt, 'Never', MOBILE_LOOP_RUNTIME_TIMESTAMP_FORMAT\)\)/);
  assert.match(settingsSource, /getAppShellLoopFeatureLabels\(loop\)/);
  assert.match(settingsSource, /APP_SHELL_LOOP_LIST_PRESENTATION\.emptyTitle/);
  assert.match(settingsSource, /settingsClient\.startLoop\(loop\.id\)/);
  assert.match(settingsSource, /settingsClient\.stopLoop\(loop\.id\)/);
  assert.match(settingsSource, /settingsClient\.startAllLoops\(\)/);
  assert.match(settingsSource, /settingsClient\.stopAllLoops\(\)/);
  assert.match(settingsSource, /applyRepeatTaskRuntimeStatusInList\(prev, loop\.id, result\.status\)/);
  assert.match(settingsSource, /applyRepeatTaskRuntimeStatuses\(prev, result\.statuses\)/);
  assert.match(settingsSource, /getAppShellLoopStartAllAccessibilityLabel\(\)/);
  assert.match(settingsSource, /getAppShellLoopStopAllAccessibilityLabel\(\)/);
  assert.match(settingsSource, /getAppShellLoopStartScheduleAccessibilityLabel\(loop\.name\)/);
  assert.match(settingsSource, /getAppShellLoopStopScheduleAccessibilityLabel\(loop\.name\)/);
  assert.match(settingsSource, /getAppShellLoopStartAllActionLabel\(loopBulkRuntimeAction === 'start-all'\)/);
  assert.match(settingsSource, /getAppShellLoopStopAllActionLabel\(loopBulkRuntimeAction === 'stop-all'\)/);
});
