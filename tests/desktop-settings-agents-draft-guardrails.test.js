const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-agents.tsx'),
  'utf8'
);

test('agent editor tracks a dirty baseline and warns before canceling a dirty draft', () => {
  assert.match(source, /const \[editingBaseline, setEditingBaseline\] = useState<EditingAgent \| null>\(null\)/);
  assert.match(source, /const isEditingDirty = hasAgentDraftChanges\(editing, editingBaseline\)/);
  assert.match(source, /Discard this new agent draft\? Your unsaved changes will be lost\./);
  assert.match(source, /Discard your changes to [\s\S]*?Your unsaved edits will be lost\./);
  assert.match(source, /You have unsaved changes\. Save before leaving or replacing this draft\./);
});

test('quick setup presets confirm before overwriting an in-progress agent draft', () => {
  assert.match(source, /const handleApplyPreset = \(preset: Partial<EditingAgent>\) => \{/);
  assert.match(source, /Apply this preset and replace your current draft\? Your unsaved changes will be overwritten\./);
  assert.match(source, /onClick=\{\(\) => handleApplyPreset\(preset\)\}/);
});

test('advanced system prompt reset and save flow now have guardrails', () => {
  assert.match(source, /const handleResetSystemPrompt = \(\) => \{/);
  assert.match(source, /Reset this custom system prompt and use the default base prompt instead\?/);
  assert.match(source, /className=\{isSavingAgent \? "pointer-events-none opacity-70" : undefined\}/);
  assert.match(source, /\{isSavingAgent \? \(isCreating \? "Creating\.\.\." : "Saving\.\.\."\) : "Save"\}/);
  assert.match(source, /Failed to save agent\. Your changes are still open\./);
});