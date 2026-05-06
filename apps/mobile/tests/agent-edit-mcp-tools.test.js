const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

test('loads operator MCP tools for per-agent mobile MCP tool overrides', () => {
  assert.match(screenSource, /type OperatorMCPToolSummary/);
  assert.match(screenSource, /const \[mcpToolsByServer, setMcpToolsByServer\]/);
  assert.match(screenSource, /const \[isMcpToolsLoading, setIsMcpToolsLoading\]/);
  assert.match(screenSource, /settingsClient\.getOperatorMCPTools\(server\.name\)/);
  assert.match(screenSource, /\.filter\(\(tool\) => tool\.sourceKind === 'mcp'\)/);
  assert.match(screenSource, /setMcpToolsByServer\(Object\.fromEntries\(entries\)\)/);
});

test('persists per-agent disabled MCP tools through toolConfig.disabledTools', () => {
  assert.match(screenSource, /isMcpToolEnabledByConfig\(tool\.name, formData\.toolConfig\)/);
  assert.match(screenSource, /const toggleMcpTool = useCallback\(\(toolName: string\) =>/);
  assert.match(screenSource, /const currentDisabledTools = currentConfig\.disabledTools \?\? \[\]/);
  assert.match(screenSource, /disabledTools: disabledTools\.length > 0 \? disabledTools : undefined/);
  assert.match(screenSource, /onValueChange=\{\(\) => toggleMcpTool\(tool\.name\)\}/);
});

test('keeps mobile MCP tool rows compact and accessible under enabled servers', () => {
  assert.match(screenSource, /styles\.mcpToolList/);
  assert.match(screenSource, /styles\.mcpToolRow/);
  assert.match(screenSource, /styles\.mcpToolName/);
  assert.match(screenSource, /styles\.mcpToolDescription/);
  assert.match(screenSource, /enabled && tools\.length > 0/);
  assert.match(screenSource, /disabled=\{isBuiltInAgent \|\| !enabled\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`\$\{toolEnabled \? 'Disable' : 'Enable'\} \$\{tool\.name\} MCP tool for this agent`\)/);
});
