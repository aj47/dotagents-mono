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

test('mobile settings restores MCP OAuth controls without shared settings helpers', () => {
  assert.match(settingsSource, /const \[mcpOAuthStatus, setMcpOAuthStatus\]/);
  assert.match(settingsSource, /refreshMcpOAuthStatuses/);
  assert.match(settingsSource, /settingsClient\.getMcpOAuthStatus\(server\.name\)/);
  assert.match(settingsSource, /settingsClient\.initiateMcpOAuthFlow\(serverName\)/);
  assert.match(settingsSource, /settingsClient\.revokeMcpOAuthTokens\(serverName\)/);
  assert.match(settingsSource, /oauthEnabled/);
  assert.match(settingsSource, /oauthScope/);
  assert.match(settingsSource, /oauthClientId/);
  assert.match(settingsSource, /OAuth \$\{oauthStatus\.authenticated \? 'connected' : 'needs auth'\}/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/mcp-api/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/mcp-utils/);
});

test('mobile settings can import and export MCP server configs locally', () => {
  assert.match(settingsSource, /const \[showMcpImportModal, setShowMcpImportModal\]/);
  assert.match(settingsSource, /parseMcpConfigImport/);
  assert.match(settingsSource, /settingsClient\.importMCPServerConfigs\(importConfig\)/);
  assert.match(settingsSource, /settingsClient\.exportMCPServerConfigs\(\)/);
  assert.match(settingsSource, /JSON\.stringify\(result\.config, null, 2\)/);
  assert.match(settingsSource, /Close MCP server import modal/);
});

test('mobile client and desktop remote server expose narrow MCP OAuth and import routes', () => {
  assert.match(mobileClientSource, /async getMcpOAuthStatus\(serverName: string\)/);
  assert.match(mobileClientSource, /async initiateMcpOAuthFlow\(serverName: string\)/);
  assert.match(mobileClientSource, /async revokeMcpOAuthTokens\(serverName: string\)/);
  assert.match(mobileClientSource, /async importMCPServerConfigs\(config: MCPConfig\)/);
  assert.match(mobileClientSource, /async exportMCPServerConfigs\(\)/);
  assert.match(remoteServerSource, /"\/v1\/mcp\/config\/export"/);
  assert.match(remoteServerSource, /"\/v1\/mcp\/config\/import"/);
  assert.match(remoteServerSource, /"\/v1\/mcp\/servers\/:name\/oauth"/);
  assert.match(remoteServerSource, /mcpService\.initiateOAuthFlow\(serverName\)/);
  assert.match(remoteServerSource, /mcpService\.revokeOAuthTokens\(serverName\)/);
});
