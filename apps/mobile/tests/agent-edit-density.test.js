const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const screenSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'AgentEditScreen.tsx'),
  'utf8'
);

test('avoids decorative warning emoji chrome in the mobile agent edit screen', () => {
  assert.doesNotMatch(screenSource, /⚠️/);
  assert.match(screenSource, /<Text style=\{styles\.warningText\}>Built-in agents have limited editing options<\/Text>/);
});

test('keeps mobile agent edit errors text-first after removing banner emoji', () => {
  assert.match(screenSource, /<Text style=\{styles\.errorText\}>\{error\}<\/Text>/);
  assert.match(screenSource, /setError\(err\.message \|\| 'Failed to (load|save) agent'\);/);
});

test('makes custom mobile agent system prompts obvious before default updates are blocked', () => {
  assert.match(screenSource, /const customSystemPromptActive = formData\.systemPrompt\.trim\(\)\.length > 0;/);
  assert.match(screenSource, /Custom system prompt active/);
  assert.match(screenSource, /will not receive DotAgents default system prompt updates until you reset it/);
  assert.match(screenSource, /Reset to default/);
});