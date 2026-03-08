const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-skills.tsx'),
  'utf8'
);

test('create skill dialog warns before discarding a dirty draft', () => {
  assert.match(source, /const handleCreateDialogOpenChange = \(open: boolean\) => \{/);
  assert.match(source, /if \(createSkillMutation\.isPending\) return/);
  assert.match(source, /Discard this new skill draft\? Your unsaved changes will be lost\./);
  assert.match(source, /<Dialog open=\{isCreateDialogOpen\} onOpenChange=\{handleCreateDialogOpenChange\}>/);
  assert.match(source, /const closeCreateDialog = \(\) => \{[\s\S]*?resetNewSkillForm\(\)/);
});

test('edit skill dialog tracks dirty state and warns before discarding changes', () => {
  assert.match(source, /const \[editingSkillBaseline, setEditingSkillBaseline\] = useState<SkillDraft \| null>\(null\)/);
  assert.match(source, /setEditingSkillBaseline\(toSkillDraft\(skill\)\)/);
  assert.match(source, /const isEditSkillDirty = hasSkillDraftChanges\(editingSkill, editingSkillBaseline\)/);
  assert.match(source, /Discard your changes to [\s\S]*?Your unsaved edits will be lost\./);
  assert.match(source, /<Dialog open=\{isEditDialogOpen\} onOpenChange=\{handleEditDialogOpenChange\}>/);
  assert.match(source, /const closeEditDialog = \(\) => \{[\s\S]*?setEditingSkillBaseline\(null\)/);
});

test('both create and edit dialogs surface visible unsaved-change guidance', () => {
  const matches = source.match(/You have unsaved changes\. Save before closing to keep this draft\./g) || [];
  assert.equal(matches.length, 2);
});