const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const operationsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'OperationsScreen.tsx'),
  'utf8'
);
const remoteAccessDraftsSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'operator-remote-access-drafts.ts'),
  'utf8'
);

test('exposes compact remote access settings for mobile remote ops', () => {
  assert.match(operationsSource, /Remote access settings/);
  assert.match(operationsSource, /Remote Server/);
  assert.match(operationsSource, /Bind Address/);
  assert.match(operationsSource, /Log Level/);
  assert.match(operationsSource, /REMOTE_SERVER_BIND_ADDRESS_DISPLAY_OPTIONS/);
  assert.match(operationsSource, /REMOTE_SERVER_CORS_ORIGINS_FIELD_METADATA/);
  assert.match(operationsSource, /REMOTE_SERVER_LOG_LEVEL_DISPLAY_OPTIONS/);
  assert.match(operationsSource, /DEFAULT_REMOTE_SERVER_BIND_ADDRESS/);
  assert.match(operationsSource, /DEFAULT_REMOTE_SERVER_ENABLED/);
  assert.match(operationsSource, /DEFAULT_REMOTE_SERVER_AUTO_SHOW_PANEL/);
  assert.match(operationsSource, /DEFAULT_REMOTE_SERVER_LOG_LEVEL/);
  assert.match(operationsSource, /DEFAULT_REMOTE_SERVER_CORS_ORIGINS/);
  assert.match(operationsSource, /DEFAULT_REMOTE_SERVER_PORT/);
  assert.match(operationsSource, /DEFAULT_REMOTE_SERVER_TERMINAL_QR_ENABLED/);
  assert.match(operationsSource, /DEFAULT_HIDE_DOCK_ICON/);
  assert.match(operationsSource, /DEFAULT_LAUNCH_AT_LOGIN/);
  assert.match(operationsSource, /DEFAULT_TEXT_INPUT_ENABLED/);
  assert.match(operationsSource, /DEFAULT_THEME_PREFERENCE/);
  assert.match(operationsSource, /THEME_PREFERENCE_OPTIONS/);
  assert.doesNotMatch(operationsSource, /DESKTOP_THEME_OPTIONS/);
  assert.match(operationsSource, /DEFAULT_FLOATING_PANEL_AUTO_SHOW/);
  assert.match(operationsSource, /DEFAULT_HIDE_PANEL_WHEN_MAIN_FOCUSED/);
  assert.match(operationsSource, /DEFAULT_PANEL_DRAG_ENABLED/);
  assert.match(operationsSource, /DEFAULT_PANEL_POSITION/);
  assert.match(operationsSource, /PANEL_POSITION_OPTIONS/);
  assert.match(operationsSource, /option\.compactLabel/);
  assert.doesNotMatch(operationsSource, /const PANEL_POSITION_OPTIONS/);
  assert.match(operationsSource, /REMOTE_SERVER_PORT_MIN/);
  assert.match(operationsSource, /REMOTE_SERVER_PORT_MAX/);
  assert.match(operationsSource, /isRemoteServerPortUpdateValue/);
  assert.match(operationsSource, /buildOperatorRemoteAccessDrafts as buildDrafts/);
  assert.match(remoteAccessDraftsSource, /DEFAULT_REMOTE_SERVER_CORS_ORIGINS/);
  assert.match(remoteAccessDraftsSource, /DEFAULT_REMOTE_SERVER_PORT/);
  assert.match(remoteAccessDraftsSource, /remoteServerPort: String\(settings\?\.remoteServerPort \?\? DEFAULT_REMOTE_SERVER_PORT\)/);
  assert.match(remoteAccessDraftsSource, /remoteServerCorsOrigins: formatConfigListInput\(settings\?\.remoteServerCorsOrigins \?\? DEFAULT_REMOTE_SERVER_CORS_ORIGINS\)/);
  assert.match(operationsSource, /remoteServerBindAddress: option\.value/);
  assert.match(operationsSource, /option\.successMessage/);
  assert.match(operationsSource, /remoteServerLogLevel: option\.value/);
  assert.match(operationsSource, /Use \$\{option\.label\} remote server log level/);
  assert.match(operationsSource, /remoteServerCorsOrigins: origins\.length > 0 \? origins : \[\.\.\.DEFAULT_REMOTE_SERVER_CORS_ORIGINS\]/);
  assert.doesNotMatch(operationsSource, /placeholder="\* or http:\/\/localhost:8081/);
  assert.match(operationsSource, /Auto-Show Panel/);
  assert.match(operationsSource, /Terminal QR/);
  assert.match(operationsSource, /Trusted operator devices/);
  assert.match(operationsSource, /Current device ID:/);
  assert.match(operationsSource, /Trust this device/);
  assert.match(operationsSource, /isDesktopMac/);
  assert.match(operationsSource, /Desktop app/);
  assert.match(operationsSource, /Hide Dock Icon/);
  assert.match(operationsSource, /Launch at Login/);
  assert.match(operationsSource, /Desktop Theme/);
  assert.match(operationsSource, /hideDockIcon: value/);
  assert.match(operationsSource, /launchAtLogin: value/);
  assert.match(operationsSource, /themePreference: option\.value/);
  assert.match(operationsSource, /Text Input/);
  assert.match(operationsSource, /textInputEnabled: value/);
  assert.match(operationsSource, /Desktop floating panel/);
  assert.match(operationsSource, /Auto-Show Floating Panel/);
  assert.match(operationsSource, /Hide When Main Focused/);
  assert.match(operationsSource, /Enable Dragging/);
  assert.match(operationsSource, /Default Position/);
  assert.match(operationsSource, /floatingPanelAutoShow: value/);
  assert.match(operationsSource, /hidePanelWhenMainFocused: value/);
  assert.match(operationsSource, /panelDragEnabled: value/);
  assert.match(operationsSource, /panelPosition: option\.value/);
  assert.match(operationsSource, /Tunnel Mode/);
  assert.match(operationsSource, /CLOUDFLARE_TUNNEL_MODE_DISPLAY_OPTIONS/);
  assert.match(operationsSource, /DEFAULT_CLOUDFLARE_TUNNEL_MODE/);
  assert.match(operationsSource, /DEFAULT_CLOUDFLARE_TUNNEL_AUTO_START/);
  assert.match(operationsSource, /Auto-Start Tunnel/);
  assert.match(operationsSource, /Tunnel Name/);
  assert.match(remoteAccessDraftsSource, /cloudflareTunnelName: settings\?\.cloudflareTunnelName \?\? ""/);
  assert.match(operationsSource, /cloudflareTunnelMode: option\.value/);
  assert.match(operationsSource, /cloudflareTunnelName: drafts\.cloudflareTunnelName\.trim\(\)/);
  assert.match(operationsSource, /Credentials Path/);
  assert.match(operationsSource, /Channel operator allowlists/);
  assert.match(operationsSource, /Discord Operator User IDs/);
  assert.match(operationsSource, /Discord Operator Guild IDs/);
  assert.match(operationsSource, /Discord Operator Channel IDs/);
  assert.match(operationsSource, /Discord Operator Role IDs/);
  assert.match(remoteAccessDraftsSource, /discordOperatorAllowRoleIds: formatConfigListInput\(settings\?\.discordOperatorAllowRoleIds\)/);
  assert.match(operationsSource, /discordOperatorAllowRoleIds: parseConfigListInput\(drafts\.discordOperatorAllowRoleIds, \{ unique: true \}\)/);
  assert.match(operationsSource, /WhatsApp Operator Allowlist/);
  assert.match(operationsSource, /getDeviceIdentity/);
});

test('includes tunnel, Discord, and WhatsApp operator controls and summaries', () => {
  assert.match(operationsSource, /Tunnel status/);
  assert.match(operationsSource, /Tunnel Setup/);
  assert.match(operationsSource, /Start tunnel/);
  assert.match(operationsSource, /Stop tunnel/);
  assert.match(operationsSource, /Discord log preview/);
  assert.match(operationsSource, /Connect Discord/);
  assert.match(operationsSource, /Clear logs/);
  assert.match(operationsSource, /Connect WhatsApp/);
  assert.match(operationsSource, /Log out/);
});

test('surfaces recent operator audit entries and rotates the API key using the saved mobile config', () => {
  assert.match(operationsSource, /Recent operator audit/);
  assert.match(operationsSource, /Rotate API key/);
  assert.match(operationsSource, /Run Agent on Desktop/);
  assert.match(operationsSource, /settingsClient\.runOperatorAgent\(\{ prompt \}\)/);
  assert.match(operationsSource, /Check latest release/);
  assert.match(operationsSource, /Download latest installer/);
  assert.match(operationsSource, /Reveal downloaded installer/);
  assert.match(operationsSource, /Open downloaded installer/);
  assert.match(operationsSource, /Open release page/);
  assert.match(operationsSource, /Latest release:/);
  assert.match(operationsSource, /Recommended asset:/);
  assert.match(operationsSource, /settingsClient\.rotateOperatorApiKey\(\)/);
  assert.match(operationsSource, /settingsClient\.checkOperatorUpdater\(\)/);
  assert.match(operationsSource, /settingsClient\.downloadOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.revealOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.openOperatorUpdateAsset\(\)/);
  assert.match(operationsSource, /settingsClient\.openOperatorReleasesPage\(\)/);
  assert.match(operationsSource, /settingsClient\.stopOperatorTtsPlayback\(\)/);
  assert.match(operationsSource, /settingsClient\.showOperatorMainWindow\(\)/);
  assert.match(operationsSource, /settingsClient\.showOperatorMainWindow\('\/'\)/);
  assert.match(operationsSource, /settingsClient\.showOperatorMainWindow\('\/settings'\)/);
  assert.match(operationsSource, /settingsClient\.showOperatorPanelWindow\(\)/);
  assert.match(operationsSource, /settingsClient\.hideOperatorPanelWindow\(\)/);
  assert.match(operationsSource, /settingsClient\.resetOperatorPanelWindow\(\)/);
  assert.match(operationsSource, /Stop speech/);
  assert.match(operationsSource, /Show app/);
  assert.match(operationsSource, /History/);
  assert.match(operationsSource, /Settings/);
  assert.match(operationsSource, /Show panel/);
  assert.match(operationsSource, /Hide panel/);
  assert.match(operationsSource, /Reset panel/);
  assert.match(operationsSource, /setConfig\(nextConfig\)/);
  assert.match(operationsSource, /saveConfig\(nextConfig\)/);
});

test('displays system metrics and agent sessions from operator status', () => {
  assert.match(operationsSource, /status\.system\.hostname/);
  assert.match(operationsSource, /status\.system\.platform/);
  assert.match(operationsSource, /status\.system\.memoryUsage\.rssMB/);
  assert.match(operationsSource, /status\.system\.processUptimeSeconds/);
  assert.match(operationsSource, /formatDuration/);
  assert.match(operationsSource, /Agent sessions/);
  assert.match(operationsSource, /status\.sessions\.activeSessions/);
  assert.match(operationsSource, /status\.sessions\.activeSessionDetails/);
  assert.match(operationsSource, /status\.sessions\.recentSessionDetails/);
  assert.match(operationsSource, /s\.profileName/);
  assert.match(operationsSource, /s\.isSnoozed === true/);
  assert.match(operationsSource, /showOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /snoozeOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /unsnoozeOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /snoozeOperatorAgentSessionsAndHidePanel/);
  assert.match(operationsSource, /clearOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /clearInactiveOperatorAgentSessions\(\)/);
  assert.match(operationsSource, /Hide active agent sessions and desktop panel/);
  assert.match(operationsSource, /Hide active/);
  assert.match(operationsSource, /Dismiss \$\{s\.title \?\? s\.id\} agent session progress on desktop/);
  assert.match(operationsSource, /Clear inactive agent sessions on desktop/);
  assert.match(operationsSource, /Sessions with queued follow-ups are kept/);
  assert.match(operationsSource, /Show \$\{s\.title \?\? s\.id\} agent session on desktop/);
  assert.match(operationsSource, /isSnoozed \? 'Restore' : 'Hide'/);
  assert.match(operationsSource, /stopOperatorAgentSession\(s\.id\)/);
  assert.match(operationsSource, /Stop \$\{s\.title \?\? s\.id\} agent session/);
  assert.match(operationsSource, /No active agent sessions/);
});

test('displays desktop message queues from operator API', () => {
  assert.match(operationsSource, /getOperatorMessageQueues\(\)/);
  assert.match(operationsSource, /setMessageQueues/);
  assert.match(operationsSource, /Desktop message queues/);
  assert.match(operationsSource, /messageQueues\.map/);
  assert.match(operationsSource, /clearOperatorMessageQueue\(queue\.conversationId\)/);
  assert.match(operationsSource, /pauseOperatorMessageQueue\(queue\.conversationId\)/);
  assert.match(operationsSource, /resumeOperatorMessageQueue\(queue\.conversationId\)/);
  assert.match(operationsSource, /retryOperatorQueuedMessage\(queue\.conversationId, message\.id\)/);
  assert.match(operationsSource, /removeOperatorQueuedMessage\(queue\.conversationId, message\.id\)/);
  assert.match(operationsSource, /updateOperatorQueuedMessageText\(queue\.conversationId, message\.id, editedText\)/);
  assert.match(operationsSource, /Clear \$\{queue\.conversationId\} desktop message queue/);
  assert.match(operationsSource, /Pause \$\{queue\.conversationId\} desktop message queue/);
  assert.match(operationsSource, /Resume \$\{queue\.conversationId\} desktop message queue/);
  assert.match(operationsSource, /Retry queued message \$\{message\.id\}/);
  assert.match(operationsSource, /Edit queued message \$\{message\.id\}/);
  assert.match(operationsSource, /Remove queued message \$\{message\.id\}/);
});

test('auto-refreshes operator data periodically', () => {
  assert.match(operationsSource, /AUTO_REFRESH_INTERVAL_MS/);
  assert.match(operationsSource, /setInterval/);
  assert.match(operationsSource, /clearInterval/);
  assert.match(operationsSource, /autoRefreshRef/);
});

test('displays recent conversations from operator API', () => {
  assert.match(operationsSource, /getOperatorConversations/);
  assert.match(operationsSource, /setConversations/);
  assert.match(operationsSource, /Recent conversations/);
  assert.match(operationsSource, /conversations\.map/);
});

test('exposes desktop diagnostic report controls', () => {
  assert.match(operationsSource, /Diagnostics/);
  assert.match(operationsSource, /getOperatorDiagnosticReport\(\)/);
  assert.match(operationsSource, /saveOperatorDiagnosticReport\(\)/);
  assert.match(operationsSource, /Generate desktop diagnostic report/);
  assert.match(operationsSource, /Save diagnostic report on desktop/);
  assert.match(operationsSource, /diagnosticReport\.mcp\.availableTools/);
});

test('displays recent operator logs from operator API', () => {
  assert.match(operationsSource, /RECENT_LOG_COUNT/);
  assert.match(operationsSource, /getOperatorLogs\(RECENT_LOG_COUNT\)/);
  assert.match(operationsSource, /setOperatorLogs/);
  assert.match(operationsSource, /Recent operator logs/);
  assert.match(operationsSource, /operatorLogs\.map/);
  assert.match(operationsSource, /settingsClient\.clearOperatorErrors\(\)/);
  assert.match(operationsSource, /Clear desktop operator error log/);
});

test('displays MCP servers from operator API', () => {
  assert.match(operationsSource, /getOperatorMCP/);
  assert.match(operationsSource, /setMcpServers/);
  assert.match(operationsSource, /MCP servers/);
  assert.match(operationsSource, /mcpServers\.map/);
  assert.match(operationsSource, /Start \$\{s\.name\} MCP server/);
  assert.match(operationsSource, /Stop \$\{s\.name\} MCP server/);
  assert.match(operationsSource, /Restart \$\{s\.name\} MCP server/);
  assert.match(operationsSource, /Test \$\{s\.name\} MCP server connection/);
  assert.match(operationsSource, /testOperatorMCPServer\(s\.name\)/);
  assert.match(operationsSource, /MCP_LOG_PREVIEW_COUNT/);
  assert.match(operationsSource, /getOperatorMCPServerLogs\(serverName, MCP_LOG_PREVIEW_COUNT\)/);
  assert.match(operationsSource, /clearOperatorMCPServerLogs\(s\.name\)/);
  assert.match(operationsSource, /getOperatorMCPTools\(serverName\)/);
  assert.match(operationsSource, /setOperatorMCPToolEnabled\(toolName, enabled\)/);
  assert.match(operationsSource, /Show'} \$\{s\.name\} MCP server tools/);
  assert.match(operationsSource, /Enable \$\{tool\.name\} MCP tool/);
  assert.match(operationsSource, /settingsClient\.startMCPServer\(s\.name\)/);
  assert.match(operationsSource, /settingsClient\.stopMCPServer\(s\.name\)/);
  assert.match(operationsSource, /settingsClient\.restartMCPServer\(s\.name\)/);
  assert.match(operationsSource, /Restarted \$\{s\.name\}/);
});
