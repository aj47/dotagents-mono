const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const managerSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'components', 'mcp-config-manager.tsx'),
  'utf8'
);

const pageSource = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-mcp-tools.tsx'),
  'utf8'
);

test('MCP server dialog keeps failed saves recoverable and blocks duplicate names', () => {
  assert.match(managerSource, /const \[validationError, setValidationError\] = useState<string \| null>\(null\)/);
  assert.match(managerSource, /const \[saveError, setSaveError\] = useState<string \| null>\(null\)/);
  assert.match(managerSource, /A server named .* already exists\. Rename this draft or edit the existing server instead\./);
  assert.match(managerSource, /Your server draft is still open so you can retry\./);
  assert.match(managerSource, /Retry save/);
  assert.match(managerSource, /onEscapeKeyDown=\{\(event\) => \{/);
  assert.match(managerSource, /className=\{isSaving \? "pointer-events-none opacity-70" : undefined\}/);
});

test('MCP add and edit flows await persisted config before closing or auto-starting', () => {
  assert.match(managerSource, /await onConfigChange\(newConfig\)\s*\n\s*setShowAddDialog\(false\)/);
  assert.match(managerSource, /Start the server after the config save completes successfully/);
  assert.doesNotMatch(managerSource, /setTimeout\(async \(\) => \{/);
  assert.match(managerSource, /await onConfigChange\(newConfig\)\s*\n\s*setEditingServer\(null\)/);
  assert.match(pageSource, /await saveConfigMutation\.mutateAsync\(\{ config: newConfig \}\)/);
});