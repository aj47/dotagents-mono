const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8',
);
const mobileClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile settings can add, edit, and delete MCP servers locally', () => {
  assert.match(settingsSource, /const \[showMcpServerEditor, setShowMcpServerEditor\]/);
  assert.match(settingsSource, /openMcpServerCreateEditor/);
  assert.match(settingsSource, /openMcpServerEditEditor/);
  assert.match(settingsSource, /handleSaveMcpServer/);
  assert.match(settingsSource, /handleDeleteMcpServer/);
  assert.match(settingsSource, /No MCP servers configured/);
  assert.match(settingsSource, /Add MCP server/);
  assert.match(settingsSource, /Edit MCP server/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/mcp-utils/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/app-shell/);
});

test('mobile MCP server editor keeps config parsing narrow and explicit', () => {
  assert.match(settingsSource, /type McpServerDraft =/);
  assert.match(settingsSource, /buildMcpServerConfigFromDraft/);
  assert.match(settingsSource, /parseArgsDraft/);
  assert.match(settingsSource, /parseJsonObjectDraft/);
  assert.match(settingsSource, /MCP_TRANSPORT_OPTIONS/);
  assert.match(settingsSource, /settingsClient\.getMCPServerConfig\(server\.name\)/);
  assert.match(settingsSource, /settingsClient\.upsertMCPServerConfig\(serverName, config\)/);
  assert.match(settingsSource, /settingsClient\.deleteMCPServerConfig\(server\.name\)/);
});

test('mobile client and desktop remote server expose narrow MCP config routes', () => {
  assert.match(mobileClientSource, /async getMCPServerConfig\(serverName: string\)/);
  assert.match(mobileClientSource, /async upsertMCPServerConfig\(serverName: string, config: MCPServerConfig\)/);
  assert.match(mobileClientSource, /async deleteMCPServerConfig\(serverName: string\)/);
  assert.match(remoteServerSource, /"\/v1\/mcp\/servers\/:name\/config"/);
  assert.match(remoteServerSource, /fastify\.put\("\/v1\/mcp\/servers\/:name\/config"/);
  assert.match(remoteServerSource, /fastify\.delete\("\/v1\/mcp\/servers\/:name"/);
  assert.match(remoteServerSource, /normalizeRemoteMcpServerConfig/);
});
