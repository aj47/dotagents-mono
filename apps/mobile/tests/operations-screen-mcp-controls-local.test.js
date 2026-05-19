const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const operationsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'OperationsScreen.tsx'),
  'utf8',
);
const settingsClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8',
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8',
);

test('mobile operations restores local MCP server actions and detail panels', () => {
  assert.match(operationsSource, /const \[mcpServerLogs, setMcpServerLogs\]/);
  assert.match(operationsSource, /const \[expandedMcpLogs, setExpandedMcpLogs\]/);
  assert.match(operationsSource, /const \[mcpServerTools, setMcpServerTools\]/);
  assert.match(operationsSource, /settingsClient\.startMCPServer\(s\.name\)/);
  assert.match(operationsSource, /settingsClient\.stopMCPServer\(s\.name\)/);
  assert.match(operationsSource, /settingsClient\.testOperatorMCPServer\(s\.name\)/);
  assert.match(operationsSource, /settingsClient\.getOperatorMCPServerLogs\(serverName, MCP_LOG_PREVIEW_COUNT\)/);
  assert.match(operationsSource, /settingsClient\.setOperatorMCPToolEnabled\(tool\.name, enabled\)/);
  assert.doesNotMatch(operationsSource, /@dotagents\/shared\/operator-display-utils/);
});

test('mobile settings client exposes narrow operator MCP routes', () => {
  assert.match(settingsClientSource, /async startMCPServer\(server: string\)/);
  assert.match(settingsClientSource, /async stopMCPServer\(server: string\)/);
  assert.match(settingsClientSource, /async testOperatorMCPServer\(server: string\)/);
  assert.match(settingsClientSource, /async getOperatorMCPServerLogs\(server: string, count: number = 20\)/);
  assert.match(settingsClientSource, /async clearOperatorMCPServerLogs\(server: string\)/);
  assert.match(settingsClientSource, /async setOperatorMCPToolEnabled\(toolName: string, enabled: boolean\)/);
});

test('desktop remote server implements operator MCP controls without the shared route bundle', () => {
  assert.match(remoteServerSource, /"\/v1\/operator\/actions\/mcp-start"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/actions\/mcp-stop"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/actions\/mcp-test"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/mcp\/:server\/logs"/);
  assert.match(remoteServerSource, /"\/v1\/operator\/mcp\/tools\/toggle"/);
  assert.match(remoteServerSource, /mcpService\.setToolEnabled\(toolName, enabled\)/);
  assert.match(remoteServerSource, /mcpService\.testServerConnection\(serverName, serverConfig\)/);
  assert.doesNotMatch(remoteServerSource, /registerDesktopRemoteServerRoutes/);
});
