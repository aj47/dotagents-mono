const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

test('agent edit tracks a baseline and warns before dismissing dirty drafts', () => {
  assert.match(source, /const \[formBaseline, setFormBaseline\] = useState<AgentFormData>\(\(\) => cloneAgentFormData\(defaultFormData\)\);/);
  assert.match(source, /const hasUnsavedChanges = hasAgentFormChanges\(formData, formBaseline\);/);
  assert.match(source, /setFormBaseline\(loadedFormData\);/);
  assert.match(source, /navigation\.addListener\('beforeRemove', \(event: any\) => \{/);
  assert.match(source, /Discard this new agent draft\? Your unsaved changes will be lost\./);
  assert.match(source, /Discard your changes to \$\{agentDraftLabel\}\? Your unsaved edits will be lost\./);
  assert.match(source, /You have unsaved changes\. Save before leaving this screen to keep this draft\./);
  assert.match(source, /skipDiscardPromptRef\.current = true;\s*navigation\.dispatch\(event\.data\.action\);/);
});

test('agent edit bypasses the discard prompt after a successful save', () => {
  assert.match(source, /skipDiscardPromptRef\.current = true;\s*navigation\.goBack\(\);/);
});