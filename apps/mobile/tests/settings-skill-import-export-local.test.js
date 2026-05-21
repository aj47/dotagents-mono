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

test('mobile settings restores skill import export and bulk delete locally', () => {
  assert.match(settingsSource, /const \[showSkillImportModal, setShowSkillImportModal\]/);
  assert.match(settingsSource, /const \[showSkillGitHubImportModal, setShowSkillGitHubImportModal\]/);
  assert.match(settingsSource, /const \[selectedSkillIds, setSelectedSkillIds\]/);
  assert.match(settingsSource, /settingsClient\.importSkillFromMarkdown\(skillImportMarkdownText\.trim\(\)\)/);
  assert.match(settingsSource, /settingsClient\.importSkillFromGitHub\(skillGitHubImportText\.trim\(\)\)/);
  assert.match(settingsSource, /settingsClient\.exportSkillToMarkdown\(skill\.id\)/);
  assert.match(settingsSource, /Share\.share\(\{\s*message: result\.markdown/s);
  assert.match(settingsSource, /settingsClient\.deleteSkills\(visibleSelectedSkillIds\)/);
  assert.match(settingsSource, /toggleSkillSelection/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/app-shell/);
  assert.doesNotMatch(settingsSource, /@dotagents\/shared\/skills-api/);
});

test('mobile client exposes narrow skill import export methods', () => {
  assert.match(mobileClientSource, /async importSkillFromMarkdown\(content: string\)/);
  assert.match(mobileClientSource, /async importSkillFromGitHub\(repoIdentifier: string\)/);
  assert.match(mobileClientSource, /async exportSkillToMarkdown\(skillId: string\)/);
  assert.match(mobileClientSource, /async deleteSkills\(ids: string\[\]\)/);
  assert.match(mobileClientSource, /SkillImportGitHubResponse/);
  assert.match(mobileClientSource, /SkillDeleteMultipleResponse/);
});

test('desktop remote server exposes skill routes without shared route bundles', () => {
  assert.match(remoteServerSource, /"\/v1\/skills\/import\/markdown"/);
  assert.match(remoteServerSource, /"\/v1\/skills\/import\/github"/);
  assert.match(remoteServerSource, /"\/v1\/skills\/delete-multiple"/);
  assert.match(remoteServerSource, /"\/v1\/skills\/:id\/export\/markdown"/);
  assert.match(remoteServerSource, /skillsService\.importSkillFromMarkdown\(content\)/);
  assert.match(remoteServerSource, /skillsService\.importSkillFromGitHub\(repoIdentifier\)/);
  assert.match(remoteServerSource, /skillsService\.exportSkillToMarkdown\(params\.id\)/);
  assert.match(remoteServerSource, /cleanupStaleSkillReferencesForMobile/);
  assert.doesNotMatch(remoteServerSource, /@dotagents\/shared\/app-shell/);
});
