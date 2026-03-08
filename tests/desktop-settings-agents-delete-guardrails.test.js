const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(
  path.join(__dirname, '..', 'apps', 'desktop', 'src', 'renderer', 'src', 'pages', 'settings-agents.tsx'),
  'utf8'
);

test('agent deletion keeps local confirmation, pending state, and retryable failure context', () => {
  assert.match(source, /const \[deleteConfirmId, setDeleteConfirmId\] = useState<string \| null>\(null\)/);
  assert.match(source, /const \[pendingDeleteAgentId, setPendingDeleteAgentId\] = useState<string \| null>\(null\)/);
  assert.match(source, /const \[deleteAgentError, setDeleteAgentError\] = useState<\{ id: string; message: string \} \| null>\(null\)/);
  assert.match(source, /const deleted = await tipcClient\.deleteAgentProfile\(\{ id: agent\.id \}\)/);
  assert.match(source, /if \(!deleted\) \{\s*throw new Error\(`Couldn't delete "\$\{agent\.displayName\}" yet\. The agent is still available, so you can try again\.`\)\s*\}/);
  assert.match(source, /setAgents\(prev => prev\.filter\(existing => existing\.id !== agent\.id\)\)/);
  assert.match(source, /This removes the agent and its saved conversation history\. This action cannot be undone\./);
  assert.match(source, /deleteAgentError\?\.id === agent\.id \? "Retry delete" : "Delete agent"/);
  assert.match(source, /console\.error\("\[SettingsAgents\] Failed to delete agent", error\)/);
});

test('agent deletion no longer relies on a one-shot browser confirm prompt', () => {
  assert.doesNotMatch(source, /Are you sure you want to delete this agent\?/);
});