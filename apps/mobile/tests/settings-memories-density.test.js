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

test('keeps the mobile Memories subsection text-first instead of rendering dense tag pills', () => {
  const memoriesSection = extractBetween(
    '<CollapsibleSection id="memories" title="Memories">',
    '{/* 4m. Agents */}'
  );

  assert.doesNotMatch(memoriesSection, /styles\.providerOption/);
  assert.match(memoriesSection, /<Text style=\{styles\.memoryMetaText\} numberOfLines=\{1\}>\{formatMemoryMetadata\(memory\)\}<\/Text>/);
  assert.doesNotMatch(memoriesSection, /\+ Create Memory/);
  assert.match(memoriesSection, /<Text style=\{styles\.createAgentButtonText\}>Create memory<\/Text>/);
  assert.match(memoriesSection, /Tap a memory to edit\./);
});

test('limits mobile memory metadata to a short tag preview plus importance', () => {
  assert.match(settingsSource, /const formatMemoryMetadata = \(memory: Memory\) => \{/);
  assert.match(settingsSource, /memory\.tags\.slice\(0, 3\)/);
  assert.match(settingsSource, /metadataParts\.push\(`\+\$\{hiddenTagCount\} more`\)/);
  assert.match(settingsSource, /metadataParts\.push\(`\$\{memory\.importance\.charAt\(0\)\.toUpperCase\(\)\}\$\{memory\.importance\.slice\(1\)\} importance`\)/);
  assert.match(settingsSource, /return metadataParts\.join\(' • '\);/);
});