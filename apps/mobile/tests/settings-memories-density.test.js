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
  assert.match(memoriesSection, /accessibilityRole="button"/);
  assert.match(memoriesSection, /accessibilityLabel=\{createButtonAccessibilityLabel\(`Delete memory \$\{memory\.title\}`\)\}/);
  assert.match(memoriesSection, /Opens a confirmation prompt before permanently deleting this memory\./);
});

test('keeps mobile Memories delete actions at a 44px minimum touch target with centered text', () => {
  assert.match(settingsSource, /memoryDeleteButton:\s*\{[\s\S]*?createMinimumTouchTargetStyle\(\{[\s\S]*?minSize:\s*44,[\s\S]*?horizontalMargin:\s*0,[\s\S]*?\}\),[\s\S]*?minWidth:\s*72,/);
  assert.match(settingsSource, /memoryDeleteButtonText:\s*\{[\s\S]*?textAlign:\s*'center',/);
});