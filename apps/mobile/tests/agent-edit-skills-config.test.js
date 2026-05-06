const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const sharedApiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8'
);

test('lets mobile edit per-agent skill capability config through the shared client', () => {
  assert.match(screenSource, /AgentProfileSkillsConfigUpdateLike/);
  assert.match(screenSource, /settingsClient\.getSkills\(\)/);
  assert.match(screenSource, /normalizeAgentProfileSkillsConfigForEdit\(profile\.skillsConfig\)/);
  assert.match(screenSource, /skillsConfig: formatAgentProfileSkillsConfigForRequest\(formData\.skillsConfig\)/);
  assert.match(screenSource, /isSkillEnabledByConfig\(skill\.id, formData\.skillsConfig\)/);
});

test('keeps agent skill controls compact and accessible on mobile', () => {
  assert.match(screenSource, /<Text style=\{styles\.sectionTitle\}>Skills<\/Text>/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Enable all agent skills'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Disable all agent skills'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`\$\{enabled \? 'Disable' : 'Enable'\} \$\{skill\.name\} for this agent`\)/);
  assert.match(screenSource, /toggleAgentProfileSkillConfig\(prev\.skillsConfig, skillId, allSkillIds\)/);
  assert.match(screenSource, /minSize:\s*44/);
});

test('lets mobile edit per-agent MCP server capability config through the shared client', () => {
  assert.match(screenSource, /AgentProfileMcpConfigUpdateLike/);
  assert.match(screenSource, /settingsClient\.getMCPServers\(\)/);
  assert.match(screenSource, /normalizeAgentProfileMcpConfigForEdit\(profile\.toolConfig\)/);
  assert.match(screenSource, /toolConfig: formatAgentProfileMcpConfigForRequest\(formData\.toolConfig\)/);
  assert.match(screenSource, /isMcpServerEnabledByConfig\(server\.name, formData\.toolConfig\)/);
});

test('keeps mobile MCP server controls bulk-editable and accessible', () => {
  assert.match(screenSource, /<Text style=\{styles\.sectionTitle\}>MCP Servers<\/Text>/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Enable all agent MCP servers'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Disable all agent MCP servers'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`\$\{enabled \? 'Disable' : 'Enable'\} \$\{server\.name\} MCP server for this agent`\)/);
  assert.match(screenSource, /getAgentProfileMcpConfigAfterSetAllServersEnabled\(prev\.toolConfig, enabled\)/);
  assert.match(screenSource, /getAgentProfileMcpConfigAfterServerToggle\(prev\.toolConfig, serverName\)/);
});

test('lets mobile edit per-agent runtime tool allowlists through shared runtime definitions', () => {
  assert.match(screenSource, /dotagentsRuntimeToolDefinitions/);
  assert.match(screenSource, /AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES/);
  assert.match(screenSource, /countEnabledAgentProfileRuntimeTools\(formData\.toolConfig, runtimeToolNames, AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES\)/);
  assert.match(screenSource, /getAgentProfileRuntimeToolsConfigAfterToggle\(/);
  assert.match(screenSource, /getAgentProfileRuntimeToolsConfigAfterSetAllEnabled\(prev\.toolConfig, enabled, AGENT_PROFILE_ESSENTIAL_RUNTIME_TOOL_NAMES\)/);
});

test('keeps runtime tool controls accessible and preserves the essential tool', () => {
  assert.match(screenSource, /<Text style=\{styles\.sectionTitle\}>DotAgents Runtime Tools<\/Text>/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Enable all agent runtime tools'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Disable nonessential agent runtime tools'\)/);
  assert.match(screenSource, /isAgentProfileEssentialRuntimeToolName\(tool\.name\)/);
  assert.match(screenSource, /disabled=\{isBuiltInAgent \|\| essential\}/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`\$\{enabled \? 'Disable' : 'Enable'\} \$\{tool\.name\} runtime tool for this agent`\)/);
});

test('lets mobile edit per-agent model overrides through the shared profile config', () => {
  assert.match(screenSource, /AgentProfileModelConfigUpdateLike/);
  assert.match(screenSource, /AGENT_PROFILE_AGENT_MODEL_PROVIDER_OPTIONS/);
  assert.match(screenSource, /normalizeAgentProfileModelConfigForEdit\(profile\.modelConfig\)/);
  assert.match(screenSource, /modelConfig: formatAgentProfileModelConfigForRequest\(formData\.modelConfig\)/);
  assert.match(screenSource, /getAgentProfileAgentModelValue\(formData\.modelConfig, selectedModelProvider\)/);
});

test('keeps model override controls compact and accessible', () => {
  assert.match(screenSource, /<Text style=\{styles\.sectionTitle\}>Model<\/Text>/);
  assert.match(screenSource, /formData\.connectionType === 'internal'/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`Use \$\{provider\.label\} model for this agent`\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected, disabled: isBuiltInAgent \}\}/);
  assert.match(screenSource, /onChangeText=\{v => updateAgentModel\(selectedModelProvider, v\)\}/);
  assert.match(screenSource, /placeholder=\{getAgentModelPlaceholder\(selectedModelProvider\)\}/);
});

test('lets mobile edit per-agent properties through the shared profile payload', () => {
  assert.match(screenSource, /properties: normalizeAgentProfileProperties\(profile\.properties\)/);
  assert.match(screenSource, /properties: formatAgentProfilePropertiesForRequest\(formData\.properties\)/);
  assert.match(screenSource, /const \[newPropertyKey, setNewPropertyKey\]/);
  assert.match(screenSource, /const \[newPropertyValue, setNewPropertyValue\]/);
  assert.match(screenSource, /updatePropertyValue\(key, v\)/);
});

test('keeps property controls accessible and touch-friendly', () => {
  assert.match(screenSource, /<Text style=\{styles\.sectionTitle\}>Properties<\/Text>/);
  assert.match(screenSource, /Object\.entries\(formData\.properties\)\.map/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`Remove \$\{key\} property`\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Add agent property'\)/);
  assert.match(screenSource, /minSize:\s*44/);
});

test('shared agent profile request types expose persisted profile config fields', () => {
  assert.match(sharedApiTypesSource, /modelConfig\?: Record<string, unknown>;/);
  assert.match(sharedApiTypesSource, /toolConfig\?: Record<string, unknown>;/);
  assert.match(sharedApiTypesSource, /skillsConfig\?: Record<string, unknown>;/);
});
