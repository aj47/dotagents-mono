const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const chatScreenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'ChatScreen.tsx'),
  'utf8'
);
const settingsApiSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'lib', 'settingsApi.ts'),
  'utf8'
);
const remoteServerSource = fs.readFileSync(
  path.join(__dirname, '..', '..', 'desktop', 'src', 'main', 'remote-server.ts'),
  'utf8'
);

test('chat screen loads skills, shows slash suggestions, and expands exact slash commands before send', () => {
  assert.match(chatScreenSource, /getSlashCommandState/);
  assert.match(chatScreenSource, /replaceSlashCommandSelection/);
  assert.match(chatScreenSource, /expandSlashCommandText/);
  assert.match(chatScreenSource, /const \[availableSkills, setAvailableSkills\] = useState<Skill\[]>\(\[\]\);/);
  assert.match(chatScreenSource, /const skillsResponse = await client\.getSkills\(\);/);
  assert.match(chatScreenSource, /const detail = await client\.getSkill\(skillId\);/);
  assert.match(chatScreenSource, /Slash Commands/);
  assert.match(chatScreenSource, /Skill: \{matchedSlashSkill\.name\}/);
  assert.match(chatScreenSource, /availableSkills\.length === 0/);
  assert.match(chatScreenSource, /No enabled skills found for this agent yet\./);
  assert.match(chatScreenSource, /No skills match \\\`\/\$\{slashCommandState\.query\}\\\` for this agent\./);
  assert.match(chatScreenSource, /expandSlashCommandText\(input, skillDetail\)/);
});

test('mobile settings api exposes a skill detail fetcher for slash command expansion', () => {
  assert.match(settingsApiSource, /export interface SkillDetail extends Skill \{/);
  assert.match(settingsApiSource, /async getSkill\(skillId: string\): Promise<SkillDetail> \{/);
  assert.match(settingsApiSource, /return this\.request<SkillDetail>\(`\/skills\/\$\{encodeURIComponent\(skillId\)\}`\);/);
});

test('desktop remote server exposes per-skill detail with instructions for mobile slash commands', () => {
  assert.match(remoteServerSource, /fastify\.get\("\/v1\/skills\/:id"/);
  assert.match(remoteServerSource, /instructions: skill\.instructions/);
  assert.match(remoteServerSource, /enabled: s\.enabled/);
});