const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SkillEditScreen.tsx'),
  'utf8'
);

test('uses shared skill edit form defaults and formatting', () => {
  assert.match(screenSource, /DEFAULT_SKILL_EDIT_FORM_DATA/);
  assert.match(screenSource, /formatSkillEditFormData\(skillFromRoute\)/);
  assert.match(screenSource, /formatSkillEditFormData\(res\.skill\)/);
  assert.match(screenSource, /SkillEditFormData/);
  assert.match(screenSource, /APP_SHELL_SKILL_EDITOR_PRESENTATION\.loadingLabel/);
  assert.match(screenSource, /APP_SHELL_SKILL_EDITOR_PRESENTATION\.fields\.name\.requiredLabel/);
  assert.match(screenSource, /APP_SHELL_SKILL_EDITOR_PRESENTATION\.fields\.instructions\.helper/);
  assert.doesNotMatch(screenSource, /type SkillFormData/);
  assert.doesNotMatch(screenSource, /const defaultFormData/);
  assert.doesNotMatch(screenSource, />Loading skill\.\.\.</);
  assert.doesNotMatch(screenSource, />Name \*<\/Text>/);
});
