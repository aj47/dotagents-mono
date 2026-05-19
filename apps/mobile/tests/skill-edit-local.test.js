const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(
  path.join(__dirname, '..', 'App.tsx'),
  'utf8'
);

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SkillEditScreen.tsx'),
  'utf8'
);

const mobileClientSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);

const apiTypesSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'packages', 'shared', 'src', 'api-types.ts'),
  'utf8'
);

const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', '..', 'apps', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('mobile can navigate to a local skill editor from settings', () => {
  assert.match(appSource, /import SkillEditScreen from '\.\/src\/screens\/SkillEditScreen'/);
  assert.match(appSource, /name="SkillEdit"[\s\S]*?component=\{SkillEditScreen\}/);
  assert.match(settingsSource, /const handleSkillEdit = useCallback/);
  assert.match(settingsSource, /navigation\.navigate\('SkillEdit'/);
  assert.match(settingsSource, /onPress=\{\(\) => handleSkillEdit\(skill\)\}/);
  assert.match(settingsSource, /onPress=\{\(\) => handleSkillEdit\(\)\}/);
  assert.match(settingsSource, />\+ Create Skill<\/Text>/);
});

test('skill editor keeps form handling local instead of importing shared app-shell presentation', () => {
  assert.match(screenSource, /type SkillFormData/);
  assert.match(screenSource, /const defaultFormData/);
  assert.match(screenSource, /function skillToFormData\(skill: Skill\)/);
  assert.match(screenSource, /settingsClient\.getSkill\(effectiveSkillId\)/);
  assert.match(screenSource, /settingsClient\.createSkill\(createPayload\)/);
  assert.match(screenSource, /settingsClient\.updateSkill\(effectiveSkillId, updatePayload\)/);
  assert.match(screenSource, /Name and instructions are required/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(screenSource, /@dotagents\/shared\/skills-api/);
});

test('skill create and update flow through the existing mobile settings API', () => {
  assert.match(apiTypesSource, /export interface SkillResponse/);
  assert.match(apiTypesSource, /export interface SkillCreateRequest/);
  assert.match(apiTypesSource, /export interface SkillUpdateRequest/);
  assert.match(mobileClientSource, /async getSkill\(id: string\)/);
  assert.match(mobileClientSource, /async createSkill\(data: SkillCreateRequest\)/);
  assert.match(mobileClientSource, /async updateSkill\(id: string, data: SkillUpdateRequest\)/);
  assert.match(remoteServerSource, /fastify\.get\("\/v1\/skills\/:id"/);
  assert.match(remoteServerSource, /fastify\.post\("\/v1\/skills"/);
  assert.match(remoteServerSource, /fastify\.patch\("\/v1\/skills\/:id"/);
  assert.match(remoteServerSource, /skillsService\.createSkill\(name, description, instructions/);
  assert.match(remoteServerSource, /agentProfileService\.enableSkillForCurrentProfile\(skill\.id\)/);
  assert.match(remoteServerSource, /skillsService\.updateSkill\(params\.id, updates\)/);
});
