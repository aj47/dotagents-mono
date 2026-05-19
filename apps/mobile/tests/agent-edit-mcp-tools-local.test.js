const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const mobileClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);

const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('mobile agent editor restores per-agent MCP tool overrides locally', () => {
  assert.match(screenSource, /OperatorMCPToolSummary/);
  assert.match(screenSource, /const \[mcpToolsByServer, setMcpToolsByServer\]/);
  assert.match(screenSource, /const \[isMcpToolsLoading, setIsMcpToolsLoading\]/);
  assert.match(screenSource, /settingsClient\.getOperatorMCPTools\(server\.name\)/);
  assert.match(screenSource, /\.filter\(\(tool\) => tool\.sourceKind === 'mcp'\)/);
  assert.match(screenSource, /isMcpToolEnabledForAgent\(formData\.toolConfig, tool\.name\)/);
  assert.match(screenSource, /const toggleMcpTool = useCallback\(\(toolName: string\) =>/);
  assert.match(screenSource, /toolConfig: toggleMcpToolConfig\(prev\.toolConfig, toolName\)/);
  assert.match(screenSource, /styles\.mcpToolList/);
  assert.match(screenSource, /styles\.mcpToolRow/);
  assert.match(screenSource, /disabled=\{isBuiltInAgent \|\| !enabled\}/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(screenSource, /agent-profile-config-updates/);
});

test('operator MCP tool list uses a narrow mobile client and remote route', () => {
  assert.match(mobileClientSource, /export interface OperatorMCPToolSummary/);
  assert.match(mobileClientSource, /export interface OperatorMCPToolsResponse/);
  assert.match(mobileClientSource, /async getOperatorMCPTools\(server\?: string\)/);
  assert.match(mobileClientSource, /\/operator\/mcp\/tools/);
  assert.match(remoteServerSource, /fastify\.get\("\/v1\/operator\/mcp\/tools"/);
  assert.match(remoteServerSource, /mcpService\.getDetailedToolList\(\)/);
  assert.match(remoteServerSource, /tool\.sourceName === server \|\| tool\.serverName === server/);
});
