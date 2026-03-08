const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'memories.tsx'),
  'utf8'
);

test('desktop memories edit treats false update results as failures and keeps retry guidance inline', () => {
  assert.match(source, /const \[editErrorMessage, setEditErrorMessage\] = useState<string \| null>\(null\)/);
  assert.match(source, /const updated = await tipcClient\.updateMemory\(\{ id, updates \}\)/);
  assert.match(source, /if \(!updated\) \{\s*throw new Error\(`Failed to update memory \$\{id\}`\)/);
  assert.match(source, /Couldn't save changes to \$\{editingMemoryLabel\} yet\. Your draft is still here, so you can review it and try again\./);
  assert.match(source, /<DestructiveActionError message=\{editErrorMessage\} \/>/);
  assert.match(source, /\{editErrorMessage \? "Retry save" : "Save"\}/);
});

test('desktop memories edit warns before dismissing unsaved drafts', () => {
  assert.match(source, /const isEditDirty = editingMemory/);
  assert.match(source, /<Dialog open=\{!!editingMemory\} onOpenChange=\{handleEditDialogOpenChange\}>/);
  assert.match(source, /if \(isEditDirty && !confirm\(`Discard your changes to \$\{editingMemoryLabel\}\? Your unsaved edits will be lost\.`,?\)\) \{/);
  assert.match(source, /You have unsaved changes\. Save before closing to keep this draft\./);
  assert.match(source, /disabled=\{updateMutation\.isPending \|\| !isEditDirty\}/);
});

