const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

test('adds an explicit edit affordance to each memory row', () => {
  assert.match(settingsSource, /onPress=\{\(\) => handleMemoryEdit\(memory\)\}[\s\S]*?accessibilityRole="button"/);
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Edit \$\{memory\.title\} memory`\)/);
  assert.match(settingsSource, /Opens this memory so you can review and change what the agent remembers\./);
  assert.match(settingsSource, /renderInlineEditAffordance\(\)/);
});

test('gives memory delete actions explicit button semantics and a mobile-sized target', () => {
  assert.match(settingsSource, /createButtonAccessibilityLabel\(`Delete \$\{memory\.title\} memory`\)/);
  assert.match(settingsSource, /Removes this memory after confirmation\./);
  assert.match(settingsSource, /style=\{\[styles\.agentDeleteButton, hasPendingMemoryDelete && styles\.loopActionButtonDisabled\]\}/);
  assert.match(settingsSource, /confirmDestructiveAction\('Delete Memory', `Are you sure you want to delete "\$\{memory\.title\}"\?`, async \(\) => \{/);
});

test('memory deletion checks API success, preserves failed rows, and surfaces specific feedback', () => {
  assert.match(settingsSource, /const \[pendingMemoryDeleteId, setPendingMemoryDeleteId\] = useState<string \| null>\(null\);/);
  assert.match(settingsSource, /if \(!settingsClient \|\| pendingMemoryDeleteId\) return;/);
  assert.match(settingsSource, /const res = await settingsClient\.deleteMemory\(memory\.id\);[\s\S]*?if \(!res\?\.success\) \{/);
  assert.match(settingsSource, /throw new Error\(`Failed to delete "\$\{memory\.title\}"\.`\);/);
  assert.match(settingsSource, /setMemories\(prev => prev\.filter\(m => m\.id !== memory\.id\)\);/);
  assert.match(settingsSource, /Alert\.alert\('Delete Failed', error\.message \|\| `Failed to delete "\$\{memory\.title\}"\.`\);/);
});

test('memory rows expose delete-in-progress guardrails and busy affordances', () => {
  assert.match(settingsSource, /const isDeletingMemory = pendingMemoryDeleteId === memory\.id;/);
  assert.match(settingsSource, /const hasPendingMemoryDelete = Boolean\(pendingMemoryDeleteId\);/);
  assert.match(settingsSource, /style=\{\[styles\.agentInfoPressable, isDeletingMemory && styles\.agentInfoPressableDisabled\]\}/);
  assert.match(settingsSource, /disabled=\{isDeletingMemory\}[\s\S]*?Wait for this memory to finish deleting before editing it\./);
  assert.match(settingsSource, /Deleting memory\.\.\./);
  assert.match(settingsSource, /disabled=\{hasPendingMemoryDelete\}[\s\S]*?Wait for the current memory delete to finish before deleting another memory\./);
  assert.match(settingsSource, /<ActivityIndicator size="small" color=\{theme\.colors\.destructive\} \/>/);
});