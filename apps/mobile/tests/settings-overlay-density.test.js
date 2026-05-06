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
  assert.equal(closeTextMatches.length, 6);

  assert.match(settingsSource, /accessibilityLabel="Close model picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close endpoint picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close endpoint editor"/);
  assert.match(settingsSource, /accessibilityLabel="Close TTS model picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close TTS voice picker"/);
  assert.match(settingsSource, /accessibilityLabel="Close import profile modal"/);
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
