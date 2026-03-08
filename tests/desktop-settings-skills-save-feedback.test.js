const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-skills.tsx'),
  'utf8'
);

test('settings skills create/edit dialogs keep save failures visible with inline retry guidance', () => {
  assert.match(source, /const \[createSkillError, setCreateSkillError\] = useState<string \| null>\(null\)/);
  assert.match(source, /const \[editSkillError, setEditSkillError\] = useState<string \| null>\(null\)/);
  assert.match(source, /await createSkillMutation\.mutateAsync\(/);
  assert.match(source, /await updateSkillMutation\.mutateAsync\(/);
  assert.match(source, /Couldn't create this new skill yet\. Your draft is still open, so you can review it and try again\./);
  assert.match(source, /Couldn't save your changes to "\$\{editingSkillLabel\}" yet\. Your draft is still open, so you can review it and try again\./);
  assert.match(source, /<DialogActionError message=\{createSkillError\} \/>/);
  assert.match(source, /<DialogActionError message=\{editSkillError\} \/>/);
  assert.match(source, /createSkillError \? "Retry create" : "Create Skill"/);
  assert.match(source, /editSkillError \? "Retry save" : "Save Changes"/);
});

test('settings skills saves only enable for dirty drafts and reject blank required fields', () => {
  assert.match(source, /const canCreateSkill = isCreateSkillDirty/);
  assert.match(source, /const canUpdateSkill = !!editingSkill && isEditSkillDirty/);
  assert.match(source, /if \(!trimmedNewSkillName\) \{\s*setCreateSkillError\("Skill name is required"\)/);
  assert.match(source, /if \(!trimmedNewSkillInstructions\) \{\s*setCreateSkillError\("Skill instructions are required"\)/);
  assert.match(source, /if \(!trimmedEditingSkillName\) \{\s*setEditSkillError\("Skill name is required"\)/);
  assert.match(source, /if \(!trimmedEditingSkillInstructions\) \{\s*setEditSkillError\("Skill instructions are required"\)/);
  assert.match(source, /disabled=\{createSkillMutation\.isPending \|\| !canCreateSkill\}/);
  assert.match(source, /disabled=\{updateSkillMutation\.isPending \|\| !canUpdateSkill\}/);
});