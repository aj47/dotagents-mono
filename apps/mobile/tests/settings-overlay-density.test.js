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

test('keeps mobile settings overlay close affordances text-first and explicitly labeled', () => {
  assert.doesNotMatch(settingsSource, /<Text style=\{styles\.(?:modelPickerClose|importModalClose|modalCloseText)\}>✕<\/Text>/);

  const closeTextMatches = [
    ...settingsSource.matchAll(/<Text style=\{styles\.modalCloseText\}>Close<\/Text>/g),
  ];
  const expectedCloseLabels = [
    'Close model picker',
    'Close endpoint picker',
    'Close endpoint editor',
    'Close MCP server editor',
    'Close bundle import modal',
    'Close skill import modal',
    'Close GitHub skill import modal',
    'Close loop import modal',
    'Close MCP server import modal',
    'Close TTS model picker',
    'Close TTS voice picker',
    'Close import profile modal',
  ];
  assert.equal(closeTextMatches.length, expectedCloseLabels.length);

  for (const label of expectedCloseLabels) {
    assert.match(settingsSource, new RegExp(`accessibilityLabel="${label}"`));
  }
});

test('keeps mobile settings overlay headers compact and flex-safe on narrow widths', () => {
  const modelPickerHeaderStyles = extractBetween('modelPickerHeader: {', 'modelPickerTitle: {');
  assert.match(modelPickerHeaderStyles, /gap:\s*spacing\.sm/);
  assert.match(modelPickerHeaderStyles, /paddingHorizontal:\s*spacing\.lg/);
  assert.match(modelPickerHeaderStyles, /paddingVertical:\s*spacing\.md/);
  assert.doesNotMatch(modelPickerHeaderStyles, /padding:\s*spacing\.lg/);

  const modelPickerTitleStyles = extractBetween('modelPickerTitle: {', 'modalCloseButton: {');
  assert.match(modelPickerTitleStyles, /flex:\s*1/);
  assert.match(modelPickerTitleStyles, /flexShrink:\s*1/);
  assert.match(modelPickerTitleStyles, /paddingRight:\s*spacing\.xs/);

  const importModalHeaderStyles = extractBetween('importModalHeader: {', 'importModalTitle: {');
  assert.match(importModalHeaderStyles, /gap:\s*spacing\.sm/);

  const importModalTitleStyles = extractBetween('importModalTitle: {', 'importModalDescription: {');
  assert.match(importModalTitleStyles, /flex:\s*1/);
  assert.match(importModalTitleStyles, /flexShrink:\s*1/);
  assert.match(importModalTitleStyles, /paddingRight:\s*spacing\.xs/);
});
