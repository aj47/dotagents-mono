const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const settingsSource = fs.readFileSync(
  path.join(__dirname, '..', 'src', 'screens', 'SettingsScreen.tsx'),
  'utf8'
);

function extractBetween(startMarker, endMarker) {
  const start = settingsSource.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`);

  const end = settingsSource.indexOf(endMarker, start);
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`);

  return settingsSource.slice(start, end);
}

test('keeps the mobile Memories subsection free of decorative delete emoji chrome', () => {
  const memoriesSection = extractBetween(
    '<CollapsibleSection id="memories" title="Memories">',
    '{/* 4m. Agents */}'
  );

  assert.doesNotMatch(memoriesSection, /🗑️/);
  assert.match(memoriesSection, /<Text style=\{styles\.memoryDeleteButtonText\}>Delete<\/Text>/);
  assert.match(memoriesSection, /accessibilityLabel=\{`Delete memory \$\{memory\.title\}`\}/);
});