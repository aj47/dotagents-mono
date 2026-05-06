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
  assert.match(screenSource, /AgentSkillsConfig/);
  assert.match(screenSource, /settingsClient\.getSkills\(\)/);
  assert.match(screenSource, /normalizeAgentSkillsConfig\(profile\.skillsConfig\)/);
  assert.match(screenSource, /skillsConfig: formatSkillsConfigForRequest\(formData\.skillsConfig\)/);
  assert.match(screenSource, /isSkillEnabledByConfig\(skill\.id, formData\.skillsConfig\)/);
});

test('keeps agent skill controls compact and accessible on mobile', () => {
  assert.match(screenSource, /<Text style=\{styles\.sectionTitle\}>Skills<\/Text>/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Enable all agent skills'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\('Disable all agent skills'\)/);
  assert.match(screenSource, /createButtonAccessibilityLabel\(`\$\{enabled \? 'Disable' : 'Enable'\} \$\{skill\.name\} for this agent`\)/);
  assert.match(screenSource, /enabledSkillIds: allSkillIds\.filter\(id => id !== skillId\)/);
  assert.match(screenSource, /minSize:\s*44/);
});

test('shared agent profile request types expose persisted profile config fields', () => {
  assert.match(sharedApiTypesSource, /modelConfig\?: Record<string, unknown>;/);
  assert.match(sharedApiTypesSource, /toolConfig\?: Record<string, unknown>;/);
  assert.match(sharedApiTypesSource, /skillsConfig\?: Record<string, unknown>;/);
});
