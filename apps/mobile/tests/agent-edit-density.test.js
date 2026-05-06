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

test('uses shared per-agent model field helpers in the mobile agent editor', () => {
  assert.match(screenSource, /getAgentProfileAgentModelProvider/);
  assert.match(screenSource, /getAgentProfileAgentModelValue/);
  assert.match(screenSource, /buildAgentProfileAgentModelUpdate/);
  assert.doesNotMatch(screenSource, /const getAgentModelField/);
  assert.doesNotMatch(screenSource, /const getAgentModelValue/);
});

test('uses shared profile property helpers in the mobile agent editor', () => {
  assert.match(screenSource, /normalizeAgentProfileProperties/);
  assert.match(screenSource, /formatAgentProfilePropertiesForRequest/);
  assert.doesNotMatch(screenSource, /const normalizeAgentProperties/);
  assert.doesNotMatch(screenSource, /const formatPropertiesForRequest/);
});
