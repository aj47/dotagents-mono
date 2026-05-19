const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
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

test('agent editor keeps external setup presets and command verification local to mobile', () => {
  assert.match(screenSource, /AGENT_PROFILE_PRESETS/);
  assert.match(screenSource, /const applyAgentPreset = useCallback/);
  assert.match(screenSource, /settingsClient\.verifyExternalAgentCommand\(\{/);
  assert.match(screenSource, /probeArgs: selectedPreset\?\.verifyArgs/);
  assert.match(screenSource, /Verify setup/);
  assert.match(apiTypesSource, /export interface VerifyExternalAgentCommandRequest/);
  assert.match(apiTypesSource, /export interface VerifyExternalAgentCommandResponse/);
  assert.match(mobileClientSource, /verifyExternalAgentCommand\(data: VerifyExternalAgentCommandRequest\)/);
  assert.match(remoteServerSource, /"\/v1\/agent-profiles\/verify-command"/);
});

test('agent editor persists model, skill, MCP, runtime tool, and property overrides', () => {
  assert.match(screenSource, /modelConfig: normalizeModelConfig\(profile\.modelConfig\)/);
  assert.match(screenSource, /toolConfig: normalizeToolConfig\(profile\.toolConfig\)/);
  assert.match(screenSource, /skillsConfig: normalizeSkillsConfig\(profile\.skillsConfig\)/);
  assert.match(screenSource, /properties: normalizeProperties\(profile\.properties\)/);
  assert.match(screenSource, /modelConfig: formData\.modelConfig/);
  assert.match(screenSource, /toolConfig: formData\.toolConfig/);
  assert.match(screenSource, /skillsConfig: formData\.skillsConfig/);
  assert.match(screenSource, /properties: normalizeProperties\(formData\.properties\)/);
  assert.match(apiTypesSource, /modelConfig\?: Record<string, unknown>;/);
  assert.match(apiTypesSource, /toolConfig\?: Record<string, unknown>;/);
  assert.match(apiTypesSource, /skillsConfig\?: Record<string, unknown>;/);
});

test('agent editor exposes compact capability controls without shared app-shell presentation imports', () => {
  assert.match(screenSource, /settingsClient\.getSkills\(\)/);
  assert.match(screenSource, /settingsClient\.getMCPServers\(\)/);
  assert.match(screenSource, /Enable all agent skills/);
  assert.match(screenSource, /Disable all agent MCP servers/);
  assert.match(screenSource, /Disable nonessential agent runtime tools/);
  assert.match(screenSource, /Add agent property/);
  assert.doesNotMatch(screenSource, /APP_SHELL_AGENT_EDITOR_PRESENTATION/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/agent-profile-config-updates/);
});
