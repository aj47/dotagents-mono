const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'model-preset-manager.tsx'),
  'utf8'
);

test('create preset dialog warns before discarding a dirty draft and preserves it on save failure', () => {
  assert.match(source, /const isCreatePresetDirty = hasPresetDraftChanges\(newPreset, EMPTY_PRESET_DRAFT\)/);
  assert.match(source, /const handleCreateDialogOpenChange = \(open: boolean\) => \{/);
  assert.match(source, /if \(saveConfigMutation\.isPending\) return/);
  assert.match(source, /Discard this new preset draft\? Your unsaved changes will be lost\./);
  assert.match(source, /<Dialog open=\{isCreateDialogOpen\} onOpenChange=\{handleCreateDialogOpenChange\}>/);
  assert.match(source, /await saveConfigAsync\(\{[\s\S]*?modelPresets: \[\.\.\.existingPresets, preset\]/);
  assert.match(source, /closeCreateDialog\(\)[\s\S]*?toast\.success\("Preset created successfully"\)/);
  assert.match(source, /Couldn't save this new preset yet\. Your draft is still open, so you can try again\./);
});

test('edit preset dialog tracks a dirty baseline and keeps the draft open on failed save', () => {
  assert.match(source, /const \[editingPresetBaseline, setEditingPresetBaseline\] = useState<PresetDraft \| null>\(null\)/);
  assert.match(source, /setEditingPresetBaseline\(toPresetDraft\(preset\)\)/);
  assert.match(source, /const isEditPresetDirty = hasPresetDraftChanges\(toPresetDraft\(editingPreset\), editingPresetBaseline\)/);
  assert.match(source, /Discard your changes to [\s\S]*?Your unsaved edits will be lost\./);
  assert.match(source, /<Dialog open=\{isEditDialogOpen\} onOpenChange=\{handleEditDialogOpenChange\}>/);
  assert.match(source, /await saveConfigAsync\(updates\)/);
  assert.match(source, /closeEditDialog\(\)[\s\S]*?toast\.success\("Preset updated successfully"\)/);
  assert.match(source, /Couldn't save your [\s\S]*?Your changes are still open, so you can try again\./);
  assert.match(source, /Couldn't save your changes to [\s\S]*?Your draft is still open, so you can try again\./);
});

test('both preset dialogs surface visible unsaved-change guidance', () => {
  const matches = source.match(/You have unsaved changes\. Save before closing to keep this preset draft\./g) || [];
  assert.equal(matches.length, 2);
});

