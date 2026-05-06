const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

test('avoids decorative warning emoji chrome in the mobile agent edit screen', () => {
  assert.doesNotMatch(screenSource, /⚠️/);
  assert.match(screenSource, /<Text style=\{styles\.warningText\}>Built-in agents have limited editing options<\/Text>/);
});

test('keeps mobile agent edit errors text-first after removing banner emoji', () => {
  assert.match(screenSource, /<Text style=\{styles\.errorText\}>\{error\}<\/Text>/);
  assert.match(screenSource, /setError\(err\.message \|\| 'Failed to (load|save) agent'\);/);
});

test('uses shared per-agent model field helpers in the mobile agent editor', () => {
  assert.match(screenSource, /AGENT_PROFILE_AGENT_MODEL_PROVIDER_OPTIONS/);
  assert.match(screenSource, /getAgentProfileAgentModelProvider/);
  assert.match(screenSource, /getAgentProfileAgentModelProviderFromOptionValue/);
  assert.match(screenSource, /getAgentProfileAgentModelProviderOptionValue/);
  assert.match(screenSource, /getAgentProfileAgentModelValue/);
  assert.match(screenSource, /getAgentProfileModelConfigAfterProviderSelect/);
  assert.match(screenSource, /buildAgentProfileAgentModelUpdate/);
  assert.match(screenSource, /mergeAgentProfileModelConfig/);
  assert.doesNotMatch(screenSource, /const AGENT_MODEL_PROVIDERS = \[/);
  assert.doesNotMatch(screenSource, /const getAgentModelField/);
  assert.doesNotMatch(screenSource, /const getAgentModelValue/);
  assert.doesNotMatch(screenSource, /provider === 'global'\s*\?\s*\{\}/);
  assert.doesNotMatch(screenSource, /agentProviderId: provider/);
});

test('uses shared profile property helpers in the mobile agent editor', () => {
  assert.match(screenSource, /normalizeAgentProfileProperties/);
  assert.match(screenSource, /formatAgentProfilePropertiesForRequest/);
  assert.doesNotMatch(screenSource, /const normalizeAgentProperties/);
  assert.doesNotMatch(screenSource, /const formatPropertiesForRequest/);
});

test('uses shared profile config edit helpers in the mobile agent editor', () => {
  assert.match(screenSource, /normalizeAgentProfileModelConfigForEdit/);
  assert.match(screenSource, /normalizeAgentProfileMcpConfigForEdit/);
  assert.match(screenSource, /normalizeAgentProfileSkillsConfigForEdit/);
  assert.match(screenSource, /formatAgentProfileModelConfigForRequest/);
  assert.match(screenSource, /formatAgentProfileMcpConfigForRequest/);
  assert.match(screenSource, /formatAgentProfileSkillsConfigForRequest/);
  assert.doesNotMatch(screenSource, /const normalizeAgentModelConfig/);
  assert.doesNotMatch(screenSource, /const normalizeAgentToolConfig/);
  assert.doesNotMatch(screenSource, /const normalizeAgentSkillsConfig/);
  assert.doesNotMatch(screenSource, /const formatModelConfigForRequest/);
  assert.doesNotMatch(screenSource, /const formatToolConfigForRequest/);
  assert.doesNotMatch(screenSource, /const formatSkillsConfigForRequest/);
});

test('uses shared bulk skill config helpers in the mobile agent editor', () => {
  assert.match(screenSource, /getAgentProfileSkillsConfigAfterSetAllEnabled\(enabled\)/);
  assert.doesNotMatch(screenSource, /allSkillsDisabledByDefault: !enabled/);
});

test('uses shared enabled-count helpers in the mobile agent editor', () => {
  assert.match(screenSource, /countEnabledAgentProfileMcpServers/);
  assert.match(screenSource, /countEnabledAgentProfileMcpTools/);
  assert.match(screenSource, /countEnabledAgentProfileRuntimeTools/);
  assert.match(screenSource, /countEnabledAgentProfileSkills/);
  assert.doesNotMatch(screenSource, /const countEnabledMcpServers/);
  assert.doesNotMatch(screenSource, /const countEnabledMcpTools/);
  assert.doesNotMatch(screenSource, /const countEnabledRuntimeTools/);
  assert.doesNotMatch(screenSource, /const countEnabledSkills/);
});

test('uses shared connection type normalization in the mobile agent editor', () => {
  assert.match(screenSource, /from '@dotagents\/shared\/agent-profile-connection'/);
  assert.match(screenSource, /normalizeAgentConnectionFormFieldsForEdit/);
  assert.match(screenSource, /getAgentConnectionFormValidationError/);
  assert.doesNotMatch(screenSource, /from '\.\/agent-edit-connection-utils'/);
  assert.doesNotMatch(screenSource, /const normalizeConnectionType/);
  assert.doesNotMatch(screenSource, /profile\.connection\?\.args\?\.join\(' '\)/);
  assert.doesNotMatch(screenSource, /value === 'acp'/);
  assert.doesNotMatch(screenSource, /formData\.connectionType === 'acpx' && !formData\.connectionCommand/);
  assert.doesNotMatch(screenSource, /formData\.connectionType === 'remote' && !formData\.connectionBaseUrl/);
});
