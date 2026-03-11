const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

test('explains agent connection types and exposes them as selected-state buttons', () => {
  assert.match(screenSource, /Choose how DotAgents should reach this agent\. The setup fields below change based on this choice\./);
  assert.match(screenSource, /Uses the built-in DotAgents runtime with this profile’s prompts and settings\./);
  assert.match(screenSource, /Launches an ACP-compatible local agent command for delegation and tool work\./);
  assert.match(screenSource, /Connects to an external HTTP agent endpoint by URL\./);
  assert.match(screenSource, /const isGeneralFieldsDisabled = isFormDisabled \|\| isBuiltInAgent;/);
  assert.match(screenSource, /accessibilityRole="button"[\s\S]*?createButtonAccessibilityLabel\(`Use \$\{ct\.label\} connection for this agent`\)/);
  assert.match(screenSource, /accessibilityState=\{\{ selected: formData\.connectionType === ct\.value, disabled: isGeneralFieldsDisabled \}\}/);
});

test('shows local launch fields for ACP and stdio while keeping Base URL remote-only', () => {
  assert.match(screenSource, /const showCommandFields = formData\.connectionType === 'acp' \|\| formData\.connectionType === 'stdio';/);
  assert.match(screenSource, /const showRemoteBaseUrlField = formData\.connectionType === 'remote';/);
  assert.match(screenSource, /\{showCommandFields && \([\s\S]*?<Text style=\{styles\.label\}>Command<\/Text>[\s\S]*?<Text style=\{styles\.label\}>Arguments<\/Text>[\s\S]*?<Text style=\{styles\.label\}>Working Directory<\/Text>/);
  assert.match(screenSource, /\{showRemoteBaseUrlField && \([\s\S]*?<Text style=\{styles\.label\}>Base URL<\/Text>/);
});

test('keeps agent connection type options full-width and touch-friendly on narrow screens', () => {
  assert.match(screenSource, /connectionTypeOptions:\s*\{[\s\S]*?width:\s*'100%' as const,[\s\S]*?gap:\s*spacing\.xs/);
  assert.match(screenSource, /connectionTypeOption:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\),[\s\S]*?width:\s*'100%' as const,[\s\S]*?justifyContent:\s*'space-between',/);
  assert.match(screenSource, /connectionTypeOptionInfo:\s*\{[\s\S]*?flex:\s*1,[\s\S]*?minWidth:\s*0,[\s\S]*?\}/);
});