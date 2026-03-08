const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'predefined-prompts-menu.tsx'),
  'utf8'
);

test('predefined prompts dialog warns before discarding a dirty draft', () => {
  assert.match(source, /const \[promptBaseline, setPromptBaseline\] = useState<PromptDraft \| null>\(null\)/);
  assert.match(source, /const isPromptDirty = hasPromptDraftChanges\(activeDraft, promptBaseline\)/);
  assert.match(source, /Discard this new predefined prompt\? Your unsaved changes will be lost\./);
  assert.match(source, /Discard your changes to [\s\S]*?Your unsaved edits will be lost\./);
  assert.match(source, /<Dialog open=\{isDialogOpen\} onOpenChange=\{handleDialogOpenChange\}>/);
  assert.match(source, /You have unsaved changes\. Save before closing to keep this draft\./);
});

test('predefined prompts save keeps the draft open until persistence succeeds', () => {
  assert.match(source, /const closeDialog = \(\) => \{[\s\S]*?resetPromptForm\(\)/);
  assert.match(source, /const handleSave = async \(\) => \{/);
  assert.match(source, /await saveConfig\.mutateAsync\(/);
  assert.match(source, /closeDialog\(\)/);
  assert.match(source, /Couldn't save (?:your prompt changes|this new prompt) yet\. Your draft is still open, so you can try again\./);
  assert.match(source, /\{saveConfig\.isPending \? \(editingPrompt \? "Saving\.\.\." : "Adding\.\.\."\) : editingPrompt \? "Save Changes" : "Add Prompt"\}/);
});

test('predefined prompt deletion now asks for confirmation before removing quick access', () => {
  assert.match(source, /Delete \"\$\{prompt\.name\}\"\? This saved prompt will be removed from quick access\./);
  assert.match(source, /onClick=\{\(e\) => handleDelete\(e, prompt\)\}/);
});

