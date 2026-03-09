const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

const langfuseSection = settingsSource.match(
  /<CollapsibleSection id="langfuse" title="Langfuse">[\s\S]*?<\/CollapsibleSection>/
)?.[0] ?? '';

test('keeps the mobile langfuse section text-first without duplicate intro helper copy', () => {
  assert.ok(langfuseSection, 'expected to find the mobile Langfuse section');
  assert.match(langfuseSection, />Enable tracing</);
  assert.doesNotMatch(langfuseSection, />Langfuse Observability</);
  assert.doesNotMatch(langfuseSection, /Enable tracing and observability via Langfuse/);
  assert.match(langfuseSection, /<Text style=\{styles\.helperText\}>\s*Leave empty for Langfuse Cloud\s*<\/Text>/);
});